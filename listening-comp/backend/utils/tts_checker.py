import boto3
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger("tts_checker")

def check_tts_configuration():
    """
    Check if Amazon Polly TTS service is configured correctly.
    
    Returns:
        dict: Result containing status and detailed information
    """
    result = {
        "status": "unknown",
        "message": "",
        "details": {}
    }
    
    try:
        # Create a client to test the connection
        polly_client = boto3.client('polly')
        
        # Test with minimal text to check connection
        response = polly_client.describe_voices(LanguageCode='ja-JP')
        
        # Check if Japanese voices are available
        if response and 'Voices' in response and len(response['Voices']) > 0:
            result["status"] = "ok"
            result["message"] = "TTS service is configured correctly"
            result["details"] = {
                "available_voices": len(response['Voices']),
                "japanese_voices_available": any(voice['LanguageCode'] == 'ja-JP' for voice in response['Voices']),
                "sample_voices": [voice['Id'] for voice in response['Voices'][:3]]
            }
        else:
            result["status"] = "error"
            result["message"] = "No Japanese voices found in Polly"
            
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        error_msg = e.response.get('Error', {}).get('Message', 'Unknown error')
        
        result["status"] = "error"
        result["message"] = f"AWS Polly error: {error_code} - {error_msg}"
        
        if error_code == 'ValidationException' and 'engine is not supported in this region' in error_msg:
            result["details"]["suggestion"] = "The selected engine is not supported in your configured AWS region. Try changing to us-east-1, us-west-2, or eu-west-1."
        elif error_code in ['UnrecognizedClientException', 'AccessDeniedException', 'AuthFailure']:
            result["details"]["suggestion"] = "Check your AWS credentials and IAM permissions for Polly."
        
        logger.error(f"TTS configuration check failed: {error_msg}")
        
    except Exception as e:
        result["status"] = "error"
        result["message"] = f"Unexpected error checking TTS service: {str(e)}"
        logger.error(f"Unexpected error in TTS check: {str(e)}", exc_info=True)
        
    return result
