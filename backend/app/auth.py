import hashlib
import hmac
import os
import re
import time

import jwt
from fastapi import Header, HTTPException

from . import config, db


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2 ** 14, r=8, p=1, dklen=32)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, salt, digest = stored.split("$")
        check = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2 ** 14, r=8, p=1, dklen=32)
        return hmac.compare_digest(check.hex(), digest)
    except Exception:
        return False


def make_token(user_id: int) -> str:
    now = int(time.time())
    return jwt.encode({"sub": str(user_id), "iat": now, "exp": now + config.TOKEN_TTL_HOURS * 3600},
                      config.SECRET_KEY, algorithm="HS256")


def _user_from_header(authorization: str | None):
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    try:
        payload = jwt.decode(authorization[7:], config.SECRET_KEY, algorithms=["HS256"])
        uid = int(payload["sub"])
    except Exception:
        raise HTTPException(401, "Your session has expired. Please log in again.")
    with db.conn() as c:
        row = c.execute("SELECT id, email, name FROM users WHERE id=?", (uid,)).fetchone()
    if not row:
        raise HTTPException(401, "Account not found. Please log in again.")
    return dict(row)


def optional_user(authorization: str | None = Header(default=None)):
    return _user_from_header(authorization)


def required_user(authorization: str | None = Header(default=None)):
    user = _user_from_header(authorization)
    if not user:
        raise HTTPException(401, "Log in to continue.")
    return user


_GUEST = re.compile(r"^[A-Za-z0-9\-]{8,64}$")


def owner(authorization: str | None = Header(default=None), x_guest_id: str | None = Header(default=None)) -> str:
    """History owner: 'u:<id>' for accounts, 'g:<id>' for anonymous browsers."""
    user = _user_from_header(authorization)
    if user:
        return f"u:{user['id']}"
    if x_guest_id and _GUEST.match(x_guest_id):
        return f"g:{x_guest_id}"
    raise HTTPException(400, "Missing guest id.")


def owner_or_none(authorization: str | None = Header(default=None), x_guest_id: str | None = Header(default=None)):
    user = _user_from_header(authorization)
    if user:
        return f"u:{user['id']}"
    if x_guest_id and _GUEST.match(x_guest_id):
        return f"g:{x_guest_id}"
    return None
