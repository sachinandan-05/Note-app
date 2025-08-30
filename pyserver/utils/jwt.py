from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
import jwt
import os
import dotenv
dotenv.load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET", "secrethrejnrsibrgjfskib")
security = HTTPBearer()  # expects Authorization: Bearer <token>

def verify_jwt(token=Depends(security)):
    try:
        payload = jwt.decode(token.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
