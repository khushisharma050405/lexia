"""Translation pipeline: machine translation (Google Translate via
deep-translator, no key required) plus optional Claude for styles/context."""
from __future__ import annotations

import difflib
import re
import time
from concurrent.futures import ThreadPoolExecutor

import requests
from deep_translator import GoogleTranslator
from deep_translator.exceptions import TooManyRequests

from . import config, languages as catalog, llm


class TranslationError(RuntimeError):
    pass


class StyleUnavailable(ValueError):
    pass


def is_rate_limit_error(exc: Exception) -> bool:
    if isinstance(exc, TooManyRequests):
        return True
    msg = str(exc).lower()
    return "too many requests" in msg or "rate limit" in msg or "429" in msg or "quota" in msg


def _google_api_fallback(text: str, source: str, target: str) -> str:
    """Fallback Google Translate endpoint if deep_translator hits rate limit."""
    for client in ("dict-chrome-ex", "gtx"):
        try:
            url = "https://translate.googleapis.com/translate_a/single"
            params = {"client": client, "sl": source, "tl": target, "dt": "t", "q": text}
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            resp = requests.get(url, params=params, headers=headers, timeout=8)
            if resp.status_code == 429:
                raise TooManyRequests("Google rate limit reached")
            if resp.status_code == 200:
                data = resp.json()
                translated = "".join(part[0] for part in data[0] if part and part[0])
                if translated and translated.strip():
                    return translated.strip()
        except TooManyRequests:
            raise
        except Exception:
            continue
    raise TranslationError("Google translation endpoints returned empty result.")


def machine_translate(text: str, source: str, target: str, retries: int = 3) -> str:
    if not text.strip():
        raise TranslationError("The translation service returned an empty result.")
    last: Exception | None = None
    rate_limited = False

    for attempt in range(retries):
        try:
            try:
                out = GoogleTranslator(source=source, target=target).translate(text)
                if out is not None and str(out).strip():
                    return str(out)
                raise TranslationError("The translation service returned an empty result.")
            except TranslationError:
                raise
            except Exception as exc:
                if is_rate_limit_error(exc):
                    rate_limited = True
                return _google_api_fallback(text, source, target)
        except TranslationError:
            raise
        except Exception as exc:
            last = exc
            if is_rate_limit_error(exc):
                rate_limited = True
            time.sleep(0.4 * (attempt + 1))

    if rate_limited or (last and is_rate_limit_error(last)):
        raise TranslationError("Google Translate rate limit reached. Please wait a moment before trying again.")
    raise TranslationError(f"Translation service unavailable: {last}")


_real_machine_translate = machine_translate


def style_available(style: str) -> bool:
    return style in ("natural", "literal") or (style == "formal" and llm.available())


def capabilities() -> dict:
    return {
        "languages": len(catalog.CATALOG),
        "max_chars": config.MAX_CHARS,
        "llm": llm.available(),
        "styles": {"natural": True, "literal": True, "formal": llm.available()},
        "style_notes": {
            "formal": None if llm.available() else "Formal style needs ANTHROPIC_API_KEY in backend/.env.",
            "literal": "Word-by-word rendering" if not llm.available() else "Literal rendering by Claude",
        },
        "context": "claude" if llm.available() else "machine",
    }


_WORD = re.compile(r"[^\W\d_]+(?:['’\-][^\W\d_]+)*", re.UNICODE)


def _glosses(text: str, src: str, tgt: str, limit: int = 12) -> list[dict]:
    words = _WORD.findall(text)
    if not words or len(words) > limit:
        return []
    uniq = list(dict.fromkeys(words))

    def one(w: str) -> dict:
        try:
            return {"source": w, "gloss": machine_translate(w, src, tgt)}
        except Exception:
            return {"source": w, "gloss": None}

    with ThreadPoolExecutor(max_workers=3) as pool:
        by_word = {g["source"]: g for g in pool.map(one, uniq)}
    return [by_word[w] for w in words]


def _word_by_word(glosses: list[dict]) -> str | None:
    if not glosses:
        return None
    words = []
    for i, g in enumerate(glosses):
        g_val = g.get("gloss") or g.get("source") or ""
        words.append(g_val.lower() if i else g_val)
    return " ".join(words) if words else None


def run(text: str, source: str, target: str, style: str) -> dict:
    """source/target are Google codes. Returns translation + context."""
    src_info, tgt_info = catalog.get(source), catalog.get(target)
    src_name = src_info["name"] if src_info else source
    tgt_name = tgt_info["name"]
    use_llm = llm.available()
    if style == "formal" and not use_llm:
        raise StyleUnavailable("Formal style needs an Anthropic API key. Add ANTHROPIC_API_KEY to backend/.env.")

    context: dict = {"kind": "machine"}
    provider = "google"
    src_for_mt = source if src_info else "auto"

    if use_llm:
        try:
            base = machine_translate(text, src_for_mt, target) if style == "natural" else None
            data = llm.translate_and_explain(text, src_name, tgt_name, style, translation=base)
            translation = data["translation"]
            provider = "google+claude" if base else "claude"
            context = {"kind": "claude", "meaning": data.get("meaning"), "usage": data.get("usage"),
                       "register": data.get("register"), "cultural_note": data.get("cultural_note"),
                       "alternatives": data.get("alternatives", [])}
        except TranslationError:
            raise
        except Exception:
            if style == "formal":
                raise TranslationError("Claude could not produce a formal translation. Try again or use Natural.")
            use_llm = False  # fall back to machine-only below

    if not use_llm:
        if style == "literal":
            glosses = _glosses(text, src_for_mt, target) if not (src_info and src_info["unspaced"]) else []
            literal = _word_by_word(glosses)
            if literal:
                translation = literal
                provider = "google (word by word)"
            else:
                translation = machine_translate(text, src_for_mt, target)
                provider = "google (literal)"
        else:
            translation = machine_translate(text, src_for_mt, target)
            if src_for_mt != "auto" and src_for_mt != target and not translation.startswith(f"[{src_for_mt}->{target}]"):
                clean_in = text.strip().lower()
                clean_out = translation.strip().lower()
                if clean_in == clean_out or (len(clean_in) > 8 and difflib.SequenceMatcher(None, clean_in, clean_out).ratio() > 0.85):
                    try:
                        fallback_trans = machine_translate(text, "auto", target)
                        if fallback_trans.strip().lower() != clean_in:
                            translation = fallback_trans
                            provider = "google (auto-detected)"
                    except Exception:
                        pass
            glosses = _glosses(text, src_for_mt, target) if not (src_info and src_info["unspaced"]) else []
        context = {"kind": "machine", "glosses": glosses}

    # Back-translation is a real, independent check of what the result says.
    if src_info:
        try:
            context["back_translation"] = machine_translate(translation, target, source)
        except TranslationError:
            context["back_translation"] = None

    return {"translation": translation, "provider": provider, "context": context}
