# ...existing code...

from utils.tts_checker import check_tts_configuration

# ...existing code...

@app.get("/api/tts/status")
def tts_status():
    """
    Check the status of the TTS service
    """
    result = check_tts_configuration()
    return result

# ...existing code...