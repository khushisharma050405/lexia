# LEXIA — AI Language Translation & Recognition System

Enter text → LEXIA detects the language and its confidence → choose a target language → translate →
see the translation with its meaning, context and a language profile.

- **Frontend:** React 18 + Vite + TypeScript (plain CSS, palette-only design system)
- **Backend:** Python 3.10+ · FastAPI · SQLite
- **Detection:** [Lingua](https://github.com/pemistahl/lingua-py) statistical model + Unicode script analysis
- **Translation:** Google Translate through `deep-translator` (133 languages, **no API key needed**)
- **Optional:** Anthropic Claude for the *Formal* style and written *Meaning & Context* notes

## Pages
Landing · Translate · Language Recognition · Translation Result · History · Explore Languages · Login / Sign up · Settings

## Quick start

### 1. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # optional; everything works without editing it
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (development)
```bash
cd frontend
npm install
npm run dev                         # http://localhost:5173  (proxies /api to :8000)
```

### Single-server mode (production-style)
```bash
cd frontend && npm install && npm run build
cd ../backend && uvicorn app.main:app --port 8000   # serves the app and the API on http://localhost:8000
```

Requires an internet connection for translation (Google Translate). Detection, the language catalogue,
accounts and history work offline.

## Configuration (`backend/.env`)
| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Signs login tokens. If unset, a random key is generated and kept in `backend/data/.secret`. |
| `ANTHROPIC_API_KEY` | Optional. Enables **Formal** style and written **Meaning & Context** (register, usage, cultural notes, alternatives). |
| `ANTHROPIC_MODEL` | Model used when a key is set (default `claude-sonnet-5-5`). |
| `CORS_ORIGINS` | Origins allowed during development. |
| `TOKEN_TTL_HOURS` | Login lifetime (default 168). |

## How it works
| Step | Implementation |
|---|---|
| Detect | Count letters per Unicode script. Scripts tied to one language (Thai, Greek, Khmer, Hangul…) resolve directly; shared scripts (Latin, Cyrillic, Arabic, Devanagari, Han) go to Lingua, restricted to languages of that script. Simplified vs Traditional Chinese is told apart by character forms. |
| Confidence | Lingua's relative scores, sharpened (power 3) and renormalised. It reads as “how much stronger is the best match than the rest” — **not** a calibrated probability. One-word or mixed text correctly scores low and the UI offers alternatives. |
| Translate | `deep-translator` → Google Translate. With a Claude key, Formal/Literal are produced by Claude. |
| Styles | **Natural** = machine translation. **Literal** = Claude if configured, otherwise a real word-by-word rendering (≤ 12 words, space-separated languages). **Formal** = Claude only; the button is disabled with an explanation when no key is set. |
| Meaning & Context | Without a key: back-translation into the source language + word-by-word glosses. With a key: Claude's written notes plus back-translation. Nothing is invented. |
| History | Anonymous browsers get a private guest id (stored locally); on login/sign-up that history is moved to the account. |

## API (all under `/api`)
`GET /capabilities` · `GET /languages?q=&group=` · `GET /languages/{code}` · `POST /detect` ·
`POST /translate` · `GET /history` · `GET|DELETE /history/{id}` · `DELETE /history` ·
`POST /auth/signup|login` · `GET|PATCH|DELETE /auth/me`. Interactive docs: `http://localhost:8000/docs`.

## Tests
```bash
cd backend && pytest -q        # 14 tests: detection, catalogue, history, auth, validation (translation call stubbed)
cd frontend && npm run build   # type-checks and builds
```

## Project layout
```
backend/
  app/            main.py (routes) · detection.py · translation.py · llm.py · languages.py · auth.py · db.py · config.py
  tests/          test_api.py
  requirements.txt  .env.example
frontend/
  src/pages/      Landing, Translate, Recognize, Result, History, Explore, Auth, Settings, NotFound
  src/components/ Layout, LangPicker, Illustration, Bits, Icon
  src/lib/        api, store, types, examples
  src/styles.css  design tokens + all styles
```

## Design notes
Palette only: Soft White `#F3F4F1`, Mist `#D5DDD9`, Muted Blue-Green `#829A96`, Clay `#B47763`, Charcoal `#29302E`
(tints are mixes of these). Newsreader (serif headings) + Instrument Sans (UI), bundled locally. Language badges
use two-letter monograms instead of flags to stay inside the palette. Clay buttons use large, semi-bold white text
because Clay on Soft White is ~3.3:1 contrast.

## Known limits
- Google Translate is reached through an unofficial public endpoint (via `deep-translator`); it can rate-limit. For heavy use, swap `machine_translate()` in `backend/app/translation.py` for the official Cloud Translation API or DeepL.
- Text limit: 5,000 characters.
- Very short text (one word) is inherently ambiguous; LEXIA shows low confidence rather than guessing silently.
- Lingua recognises ~75 languages statistically; others are recognised by script when the script is distinctive. Languages without a distinctive script or model (e.g. Hausa vs Yoruba short text) may be missed — choose the source manually.
