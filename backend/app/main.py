"""LEXIA API — language detection + translation."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field, field_validator

from . import auth, config, db, detection, languages as catalog, translation

app = FastAPI(title="LEXIA API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=config.CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])
db.init()

Style = Literal["natural", "formal", "literal"]


# ---------- schemas -----------------------------------------------------------
class TextIn(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def _text(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Enter some text first.")
        if len(v) > config.MAX_CHARS:
            raise ValueError(f"Text is limited to {config.MAX_CHARS} characters.")
        return v


class TranslateIn(TextIn):
    source: str = "auto"
    target: str
    style: Style = "natural"
    save: bool = True


class SignupIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)


# ---------- general -----------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/capabilities")
def capabilities():
    return translation.capabilities()


@app.get("/api/languages")
def list_languages(q: str = "", group: str = ""):
    return {"items": catalog.search(q, group), "groups": catalog.groups(), "total": len(catalog.CATALOG)}


@app.get("/api/languages/{code}")
def language(code: str):
    info = catalog.get(code)
    if not info:
        raise HTTPException(404, "Unknown language code.")
    return info


@app.post("/api/detect")
def detect(body: TextIn):
    try:
        return detection.detect(body.text)
    except detection.DetectionError as exc:
        raise HTTPException(422, str(exc))


# ---------- translate ---------------------------------------------------------
def _save(owner_id: str, result: dict) -> None:
    with db.conn() as c:
        c.execute(
            "INSERT INTO history(id, owner, created_at, source_code, target_code, style, source_text, translation, payload)"
            " VALUES (?,?,?,?,?,?,?,?,?)",
            (result["id"], owner_id, result["created_at"], result["source"]["code"], result["target"]["code"],
             result["style"], result["source_text"], result["translation"], json.dumps(result)))


@app.post("/api/translate")
def translate(body: TranslateIn, owner_id: str | None = Depends(auth.owner_or_none)):
    target = catalog.get(body.target)
    if not target:
        raise HTTPException(422, "Choose a valid target language.")

    detected = None
    if body.source == "auto":
        try:
            detected = detection.detect(body.text)
        except detection.DetectionError as exc:
            raise HTTPException(422, str(exc))
        src = detected["language"]
        if not src["translatable"]:
            raise HTTPException(
                422, f"Detected {src['name']}, which the translation engine does not support as a source. "
                     "Choose a source language manually.")
        confidence, is_detected = detected["confidence"], True
    else:
        src = catalog.get(body.source)
        if not src:
            raise HTTPException(422, "Choose a valid source language.")
        try:  # still report what the detector thinks, for the profile panel
            detected = detection.detect(body.text)
        except detection.DetectionError:
            detected = None
        confidence, is_detected = None, False

    if src["code"] == target["code"]:
        raise HTTPException(422, "Source and target languages are the same. Pick a different target.")

    try:
        out = translation.run(body.text, src["code"], target["code"], body.style)
    except translation.StyleUnavailable as exc:
        raise HTTPException(400, str(exc))
    except translation.TranslationError as exc:
        status_code = 429 if "rate limit" in str(exc).lower() else 502
        raise HTTPException(status_code, str(exc))

    if out.get("provider") == "google (auto-detected)" and detected:
        src = detected["language"]
        is_detected = True
        confidence = detected.get("confidence")

    script_profile = (detected or {}).get("script") or {
        "name": src["script"], "purity": None, "system": src["writing_system"],
        "characters": src["characters"], "glyphs": src["glyphs"]}
    result = {
        "id": uuid.uuid4().hex[:16],
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": {**src, "detected": is_detected, "confidence": confidence,
                   "band": detected["band"] if is_detected and detected else None},
        "target": target,
        "style": body.style,
        "source_text": body.text,
        "translation": out["translation"],
        "provider": out["provider"],
        "context": out["context"],
        "profile": {
            "family": src["family"], "script": src["script"], "writing_system": src["writing_system"],
            "characters": src["characters"], "direction": "Right to left" if src["rtl"] else "Left to right",
            "detail": script_profile,
            "stats": detection.stats(body.text),
            "alternatives": (detected or {}).get("alternatives", []) if is_detected else [],
            "method": (detected or {}).get("method") if is_detected else "chosen manually",
        },
        "saved": False,
    }
    if body.save and owner_id:
        _save(owner_id, result)
        result["saved"] = True
    return result


# ---------- history -----------------------------------------------------------
@app.get("/api/history")
def history(q: str = "", limit: int = Query(200, le=500), owner_id: str = Depends(auth.owner)):
    sql = ("SELECT id, created_at, source_code, target_code, style, source_text, translation FROM history "
           "WHERE owner=?")
    args: list = [owner_id]
    if q.strip():
        sql += " AND (source_text LIKE ? OR translation LIKE ?)"
        args += [f"%{q.strip()}%"] * 2
    sql += " ORDER BY created_at DESC LIMIT ?"
    args.append(limit)
    with db.conn() as c:
        rows = [dict(r) for r in c.execute(sql, args)]
    for r in rows:
        r["source"] = catalog.get(r.pop("source_code")) or {}
        r["target"] = catalog.get(r.pop("target_code")) or {}
    return {"items": rows}


@app.get("/api/history/{item_id}")
def history_item(item_id: str, owner_id: str = Depends(auth.owner)):
    with db.conn() as c:
        row = c.execute("SELECT payload FROM history WHERE id=? AND owner=?", (item_id, owner_id)).fetchone()
    if not row:
        raise HTTPException(404, "This translation is no longer in your history.")
    result = json.loads(row["payload"])
    result["saved"] = True
    return result


@app.delete("/api/history/{item_id}")
def history_delete(item_id: str, owner_id: str = Depends(auth.owner)):
    with db.conn() as c:
        n = c.execute("DELETE FROM history WHERE id=? AND owner=?", (item_id, owner_id)).rowcount
    if not n:
        raise HTTPException(404, "Item not found.")
    return {"deleted": 1}


@app.delete("/api/history")
def history_clear(owner_id: str = Depends(auth.owner)):
    with db.conn() as c:
        n = c.execute("DELETE FROM history WHERE owner=?", (owner_id,)).rowcount
    return {"deleted": n}


# ---------- auth --------------------------------------------------------------
def _claim_guest(c, guest_id: str | None, user_id: int) -> None:
    if guest_id and auth._GUEST.match(guest_id):
        c.execute("UPDATE history SET owner=? WHERE owner=?", (f"u:{user_id}", f"g:{guest_id}"))


def _session(user: dict) -> dict:
    return {"token": auth.make_token(user["id"]), "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}


@app.post("/api/auth/signup")
def signup(body: SignupIn, x_guest_id: str | None = Header(default=None)):
    email = body.email.lower()
    with db.conn() as c:
        if c.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
            raise HTTPException(409, "An account with this email already exists. Log in instead.")
        cur = c.execute("INSERT INTO users(email, name, pw_hash) VALUES (?,?,?)",
                        (email, body.name.strip(), auth.hash_password(body.password)))
        uid = cur.lastrowid
        _claim_guest(c, x_guest_id, uid)
    return _session({"id": uid, "name": body.name.strip(), "email": email})


@app.post("/api/auth/login")
def login(body: LoginIn, x_guest_id: str | None = Header(default=None)):
    email = body.email.lower()
    with db.conn() as c:
        row = c.execute("SELECT id, email, name, pw_hash FROM users WHERE email=?", (email,)).fetchone()
        if not row or not auth.verify_password(body.password, row["pw_hash"]):
            raise HTTPException(401, "Email or password is incorrect.")
        _claim_guest(c, x_guest_id, row["id"])
    return _session(dict(row))


@app.get("/api/auth/me")
def me(user: dict = Depends(auth.required_user)):
    return {"user": user}


@app.patch("/api/auth/me")
def update_me(body: ProfileIn, user: dict = Depends(auth.required_user)):
    with db.conn() as c:
        c.execute("UPDATE users SET name=? WHERE id=?", (body.name.strip(), user["id"]))
    return {"user": {**user, "name": body.name.strip()}}


@app.delete("/api/auth/me")
def delete_me(user: dict = Depends(auth.required_user)):
    with db.conn() as c:
        c.execute("DELETE FROM history WHERE owner=?", (f"u:{user['id']}",))
        c.execute("DELETE FROM users WHERE id=?", (user["id"],))
    return {"deleted": True}


# ---------- serve the built frontend (production) -------------------------------
DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if DIST.exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith("api/"):
            raise HTTPException(404, "Not found")
        file = (DIST / path).resolve()
        if path and file.is_file() and DIST in file.parents:
            return FileResponse(file)
        return FileResponse(DIST / "index.html")
