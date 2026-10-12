"""API tests. The network translation call is replaced with a deterministic stub
so the suite runs offline; detection, history, auth and validation are real."""
import os
import tempfile

os.environ["LEXIA_DATA_DIR"] = tempfile.mkdtemp()
os.environ["ANTHROPIC_API_KEY"] = ""

import pytest
from fastapi.testclient import TestClient

from app import translation
from app.main import app

client = TestClient(app)
G = {"X-Guest-Id": "guest-test-12345"}


@pytest.fixture(autouse=True)
def stub(monkeypatch):
    def fake(text, source, target):
        return f"[{source}->{target}] {text}"
    monkeypatch.setattr(translation, "machine_translate", fake)


def test_languages_catalogue():
    r = client.get("/api/languages").json()
    assert r["total"] >= 100
    assert any(i["code"] == "hi" and i["script"] == "Devanagari" for i in r["items"])
    assert client.get("/api/languages", params={"q": "jap"}).json()["items"][0]["code"] == "ja"
    assert client.get("/api/languages/xx").status_code == 404


@pytest.mark.parametrize("text,code", [
    ("Bonjour, comment allez-vous ?", "fr"), ("Guten Morgen, wie geht es dir heute?", "de"),
    ("Hola, ¿cómo estás?", "es"), ("こんにちは", "ja"), ("مرحبا كيف حالك", "ar"),
    ("नमस्ते, आप कैसे हैं?", "hi"), ("你們這個來說怎麼樣", "zh-TW"), ("안녕하세요", "ko")])
def test_detect(text, code):
    r = client.post("/api/detect", json={"text": text}).json()
    assert r["language"]["code"] == code
    assert 0 < r["confidence"] <= 1


def test_detect_validation():
    assert client.post("/api/detect", json={"text": "   "}).status_code == 422
    assert client.post("/api/detect", json={"text": "12345 !!!"}).status_code == 422


def test_translate_history_flow():
    r = client.post("/api/translate", headers=G, json={"text": "Bonjour, comment allez-vous ?", "target": "en"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["source"]["code"] == "fr" and d["source"]["detected"] and d["saved"]
    assert d["translation"].startswith("[fr->en]")
    assert d["context"]["kind"] == "machine" and d["profile"]["family"].endswith("Romance")
    h = client.get("/api/history", headers=G).json()["items"]
    assert len(h) == 1 and h[0]["source"]["code"] == "fr"
    assert client.get(f"/api/history/{d['id']}", headers=G).json()["translation"] == d["translation"]
    assert client.get(f"/api/history/{d['id']}", headers={"X-Guest-Id": "someone-else-999"}).status_code == 404
    assert client.delete(f"/api/history/{d['id']}", headers=G).status_code == 200
    assert client.get("/api/history", headers=G).json()["items"] == []


def test_translate_rules():
    base = {"text": "Guten Morgen, wie geht es dir heute?"}
    assert client.post("/api/translate", json={**base, "target": "de"}).status_code == 422   # same language
    assert client.post("/api/translate", json={**base, "target": "zz"}).status_code == 422
    assert client.post("/api/translate", json={**base, "target": "en", "style": "formal"}).status_code == 400
    ok = client.post("/api/translate", json={**base, "target": "en", "save": False, "style": "literal"})
    assert ok.status_code == 200 and not ok.json()["saved"]


def test_manual_source_and_clear():
    r = client.post("/api/translate", headers=G, json={"text": "Hola", "source": "es", "target": "fr"})
    assert r.status_code == 200 and r.json()["source"]["detected"] is False
    assert client.delete("/api/history", headers=G).json()["deleted"] >= 1


def test_auth_and_guest_claim():
    client.post("/api/translate", headers=G, json={"text": "Guten Morgen, wie geht es dir?", "target": "en"})
    s = client.post("/api/auth/signup", headers=G, json={"name": "Asha", "email": "asha@example.com", "password": "longpassword"})
    assert s.status_code == 200, s.text
    tok = {"Authorization": f"Bearer {s.json()['token']}"}
    assert len(client.get("/api/history", headers=tok).json()["items"]) == 1  # guest history moved over
    assert client.post("/api/auth/signup", json={"name": "A", "email": "asha@example.com", "password": "longpassword"}).status_code == 409
    assert client.post("/api/auth/login", json={"email": "asha@example.com", "password": "wrong-pass"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "asha@example.com", "password": "longpassword"}).status_code == 200
    assert client.patch("/api/auth/me", headers=tok, json={"name": "Asha K"}).json()["user"]["name"] == "Asha K"
    assert client.get("/api/auth/me").status_code == 401
    assert client.delete("/api/auth/me", headers=tok).status_code == 200


def test_rate_limit_retry_and_clear_error(monkeypatch):
    from deep_translator.exceptions import TooManyRequests

    call_count = 0

    def mock_rate_limit(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        raise TooManyRequests("Rate limited by Google")

    # Mock both deep_translator and fallback to simulate Google completely rate limiting
    monkeypatch.setattr(translation, "GoogleTranslator", lambda **kw: type("obj", (), {"translate": mock_rate_limit})())
    monkeypatch.setattr(translation, "_google_api_fallback", mock_rate_limit)

    with pytest.raises(translation.TranslationError) as exc_info:
        translation._real_machine_translate("Bonjour", "fr", "en", retries=3)

    assert "rate limit reached" in str(exc_info.value).lower()
    assert call_count == 6  # verified 3 retries trying both primary and fallback

    # Test API endpoint response on rate limit
    def mock_fail_translate(text, src, tgt):
        raise translation.TranslationError("Google Translate rate limit reached. Please wait a moment before trying again.")

    monkeypatch.setattr(translation, "machine_translate", mock_fail_translate)
    r = client.post("/api/translate", json={"text": "Bonjour", "source": "fr", "target": "en"})
    assert r.status_code == 429
    assert "rate limit" in r.json()["detail"].lower()


def test_literal_style_resilience():
    # Long text (> 12 words) in literal style must not fail with 400 StyleUnavailable
    long_text = "This is a longer sentence with more than twelve words designed to verify that literal translation works seamlessly."
    r = client.post("/api/translate", json={"text": long_text, "source": "en", "target": "es", "style": "literal", "save": False})
    assert r.status_code == 200
    assert r.json()["provider"] in ("google (word by word)", "google (literal)")


def test_mismatched_source_auto_fallback(monkeypatch):
    # If translation returned untranslated text due to wrong source, it falls back to auto-detection
    def mock_echo_on_chinese(text, src, tgt):
        if src == "zh-TW":
            return text  # returns untranslated text
        return f"[translated from {src}] {text}"

    monkeypatch.setattr(translation, "machine_translate", mock_echo_on_chinese)
    french_text = "La technologie change notre façon d'apprendre."
    r = client.post("/api/translate", json={"text": french_text, "source": "zh-TW", "target": "en"})
    assert r.status_code == 200
    assert r.json()["translation"].startswith("[translated from auto]")


