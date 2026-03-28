from fastapi import APIRouter

from app.api.routes.mp3 import router as mp3_router


api_router = APIRouter()
api_router.include_router(mp3_router, prefix="/mp3", tags=["mp3"])
