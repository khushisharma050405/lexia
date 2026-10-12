"""Runtime configuration, read from environment / .env."""
import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATA_DIR = Path(os.getenv("LEXIA_DATA_DIR", BASE_DIR / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = Path(os.getenv("LEXIA_DB_PATH", DATA_DIR / "lexia.db"))


def _secret() -> str:
    value = os.getenv("SECRET_KEY", "").strip()
    if value and not value.startswith("change-me"):
        return value
    # No usable key supplied: generate one once and keep it on disk so
    # login sessions survive restarts.
    path = DATA_DIR / ".secret"
    if not path.exists():
        path.write_text(secrets.token_hex(32))
    return path.read_text().strip()


SECRET_KEY = _secret()
TOKEN_TTL_HOURS = int(os.getenv("TOKEN_TTL_HOURS", "168"))
MAX_CHARS = 5000  # limit of the Google Translate endpoint used by deep-translator

CORS_ORIGINS = [o.strip() for o in os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5").strip()
