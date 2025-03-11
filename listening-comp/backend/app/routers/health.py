from fastapi import APIRouter

router = APIRouter()

@router.get("/api/health")
@router.get("/health")
async def health_check():
    return {"status": "OK"}

@router.get("/ping")
async def ping():
    return "pong"
