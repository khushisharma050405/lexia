"""Language detection.

Strategy
1. Count letters per Unicode script to find the dominant script.
2. Scripts used by (practically) one language in the catalogue are resolved
   directly from the script (Thai, Khmer, Greek, ...).
3. Shared scripts (Latin, Cyrillic, Arabic, Devanagari, Han) are resolved with
   the Lingua statistical detector, restricted to languages that use that
   script so the confidence values are meaningful.
"""
from __future__ import annotations

import re
import unicodedata
from functools import lru_cache

from lingua import Language as L
from lingua import LanguageDetectorBuilder

from . import languages as catalog

# (start, end, script) ----------------------------------------------------
RANGES = [
    (0x0041, 0x005A, "Latin"), (0x0061, 0x007A, "Latin"), (0x00C0, 0x024F, "Latin"), (0x1E00, 0x1EFF, "Latin"),
    (0x0370, 0x03FF, "Greek"), (0x1F00, 0x1FFF, "Greek"),
    (0x0400, 0x052F, "Cyrillic"),
    (0x0530, 0x058F, "Armenian"),
    (0x0590, 0x05FF, "Hebrew"),
    (0x0600, 0x06FF, "Arabic"), (0x0750, 0x077F, "Arabic"), (0x08A0, 0x08FF, "Arabic"),
    (0xFB50, 0xFDFF, "Arabic"), (0xFE70, 0xFEFF, "Arabic"),
    (0x0780, 0x07BF, "Thaana"),
    (0x0900, 0x097F, "Devanagari"),
    (0x0980, 0x09FF, "Bengali–Assamese"),
    (0x0A00, 0x0A7F, "Gurmukhi"), (0x0A80, 0x0AFF, "Gujarati"), (0x0B00, 0x0B7F, "Odia"),
    (0x0B80, 0x0BFF, "Tamil"), (0x0C00, 0x0C7F, "Telugu"), (0x0C80, 0x0CFF, "Kannada"),
    (0x0D00, 0x0D7F, "Malayalam"), (0x0D80, 0x0DFF, "Sinhala"),
    (0x0E00, 0x0E7F, "Thai"), (0x0E80, 0x0EFF, "Lao"),
    (0x1000, 0x109F, "Myanmar"), (0x10A0, 0x10FF, "Georgian"), (0x1C90, 0x1CBF, "Georgian"),
    (0x1200, 0x137F, "Ethiopic"), (0x1780, 0x17FF, "Khmer"),
    (0xABC0, 0xABFF, "Meitei Mayek"),
    (0x1100, 0x11FF, "Hangul"), (0x3130, 0x318F, "Hangul"), (0xAC00, 0xD7AF, "Hangul"),
    (0x3040, 0x30FF, "Kana"),
    (0x3400, 0x4DBF, "Han"), (0x4E00, 0x9FFF, "Han"),
]

# Script -> language code, for scripts that effectively identify the language.
SCRIPT_TO_LANG = {
    "Greek": "el", "Armenian": "hy", "Georgian": "ka", "Thai": "th", "Lao": "lo", "Khmer": "km",
    "Myanmar": "my", "Sinhala": "si", "Kannada": "kn", "Malayalam": "ml", "Odia": "or", "Thaana": "dv",
    "Tamil": "ta", "Telugu": "te", "Gurmukhi": "pa", "Gujarati": "gu", "Hangul": "ko",
    "Hebrew": "iw", "Ethiopic": "am", "Meitei Mayek": "mni-Mtei", "Bengali–Assamese": "bn",
    "Kana": "ja",
}
# Languages sharing such a script, offered as alternatives.
SCRIPT_ALTERNATIVES = {"Hebrew": ["yi"], "Ethiopic": ["ti"], "Bengali–Assamese": ["as"]}

_CYR = [L.BELARUSIAN, L.BULGARIAN, L.KAZAKH, L.MACEDONIAN, L.MONGOLIAN, L.RUSSIAN, L.SERBIAN, L.UKRAINIAN]
_ARA = [L.ARABIC, L.PERSIAN, L.URDU]
_DEV = [L.HINDI, L.MARATHI]
_HAN = [L.CHINESE, L.JAPANESE]
_NON_LATIN = set(_CYR + _ARA + _DEV + _HAN + [
    L.ARMENIAN, L.BENGALI, L.GEORGIAN, L.GREEK, L.GUJARATI, L.HEBREW, L.JAPANESE, L.KOREAN,
    L.PUNJABI, L.TAMIL, L.TELUGU, L.THAI, L.SERBIAN, L.CHINESE])
_LAT = [lang for lang in L.all() if lang not in _NON_LATIN]
CANDIDATES = {"Latin": _LAT, "Cyrillic": _CYR, "Arabic": _ARA, "Devanagari": _DEV, "Han": _HAN}

# Simplified / Traditional pairs used to tell the two Chinese forms apart.
_SIMP = "们这个来说时会为国学发电开关对问见现过还进动经长门车东书买卖请样应"
_TRAD = "們這個來說時會為國學發電開關對問見現過還進動經長門車東書買賣請樣應"
_SIMP_SET, _TRAD_SET = set(_SIMP), set(_TRAD)

SHARPEN = 3
LINGUA_TO_GOOGLE = {"zh": "zh-CN", "he": "iw", "nb": "no", "nn": "no"}


class DetectionError(ValueError):
    pass


@lru_cache(maxsize=None)
def _detector(script: str):
    return LanguageDetectorBuilder.from_languages(*CANDIDATES[script]).build()


def _script_of(ch: str) -> str | None:
    cp = ord(ch)
    for lo, hi, name in RANGES:
        if lo <= cp <= hi:
            return name
    return None


def analyse_script(text: str) -> tuple[dict[str, int], int]:
    counts: dict[str, int] = {}
    letters = 0
    for ch in text:
        if not unicodedata.category(ch).startswith(("L", "M")):
            continue
        letters += 1
        s = _script_of(ch)
        if s:
            counts[s] = counts.get(s, 0) + 1
    return counts, letters


def stats(text: str) -> dict:
    _, letters = analyse_script(text)
    return {"characters": len(text), "letters": letters, "words": len(re.findall(r"\S+", text))}


def _band(confidence: float) -> str:
    return "high" if confidence >= 0.8 else "medium" if confidence >= 0.55 else "low"


def _lang_info(code: str, name_hint: str | None = None) -> dict:
    info = catalog.get(code)
    if info:
        return {**info, "translatable": True}
    # Detected but not available in the translation engine (e.g. Tswana).
    return {"code": code, "name": name_hint or code, "native": name_hint or code, "family": "—",
            "script": "—", "rtl": False, "writing_system": "—", "characters": "—", "group": "Other scripts",
            "glyphs": "", "unspaced": False, "translatable": False}


def _han_variant(text: str) -> str:
    s = sum(1 for c in text if c in _SIMP_SET)
    t = sum(1 for c in text if c in _TRAD_SET)
    return "zh-TW" if t > s else "zh-CN"


def detect(text: str) -> dict:
    text = text.strip()
    counts, letters = analyse_script(text)
    if letters == 0 or not counts:
        raise DetectionError("No letters found to analyse. Enter some text in any language.")
    script = max(counts, key=counts.get)
    purity = counts[script] / letters
    ranked: list[tuple[str, float]] = []
    method = "script"

    if script in SCRIPT_TO_LANG and script != "Kana":
        code = SCRIPT_TO_LANG[script]
        conf = round(min(0.97, 0.55 + 0.42 * purity), 3)
        ranked = [(code, conf)] + [(a, round((1 - conf) / 2, 3)) for a in SCRIPT_ALTERNATIVES.get(script, [])]
    else:
        if "Kana" in counts:           # any kana means Japanese text
            script = "Han" if counts.get("Han", 0) > counts["Kana"] else "Kana"
            ranked = [("ja", round(min(0.99, 0.6 + 0.39 * (counts["Kana"] + counts.get("Han", 0)) / letters), 3))]
        else:
            method = "statistical model"
            values = _detector(script).compute_language_confidence_values(text)
            merged: dict[str, float] = {}
            for v in values:
                code = v.language.iso_code_639_1.name.lower()
                code = LINGUA_TO_GOOGLE.get(code, code)
                if code == "zh-CN" and script == "Han":
                    code = _han_variant(text)
                merged[code] = merged.get(code, 0.0) + v.value
            # Lingua's raw values are diffuse across many candidates, so sharpen
            # them (power 3, renormalise). This keeps the ranking and makes the
            # score read as "how much stronger is the best match than the rest".
            sharp = {c: v ** SHARPEN for c, v in merged.items()}
            total = sum(sharp.values()) or 1.0
            ranked = sorted(((c, v / total) for c, v in sharp.items()), key=lambda kv: kv[1], reverse=True)
            ranked = [(c, round(p, 3)) for c, p in ranked if p > 0.002]
            if not ranked:
                raise DetectionError("The language could not be determined. Choose it manually.")

    top, conf = ranked[0]
    # A mixed-script text is less certain.
    if purity < 0.7:
        conf = round(conf * (0.6 + 0.4 * purity), 3)
    language = _lang_info(top)
    alts = [{"language": _lang_info(c), "confidence": p} for c, p in ranked[1:4]]
    script_name = language["script"] if language["script"] != "—" else script
    return {
        "language": language,
        "confidence": conf,
        "band": _band(conf),
        "alternatives": alts,
        "method": method,
        "script": {"name": script_name, "purity": round(purity, 3),
                   "system": language["writing_system"], "characters": language["characters"],
                   "glyphs": catalog.SCRIPTS.get(script_name, {}).get("glyphs", "")},
        "stats": stats(text),
    }
