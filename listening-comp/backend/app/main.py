from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io
from .services.tts_service import tts_service
from .routers import health

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)

@app.get("/api/tts/status")
async def tts_status():
    status = await tts_service.check_status()
    if status["status"] == "error":
        raise HTTPException(status_code=503, detail=status["message"])
    return status

@app.post("/api/tts")
async def synthesize_text(text: str):
    try:
        audio = await tts_service.synthesize(text)
        if not audio:
            raise HTTPException(status_code=500, detail="Failed to generate audio")
            
        return StreamingResponse(
            io.BytesIO(audio),
            media_type="audio/mp3",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))