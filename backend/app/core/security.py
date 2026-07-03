from datetime import datetime, timedelta, timezone
from jose import jwt
from app.config import settings

def create_token(sub: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": sub, "exp": exp}, settings.jwt_secret, algorithm=settings.jwt_algo)

def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algo])