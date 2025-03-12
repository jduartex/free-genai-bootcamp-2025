import streamlit as st
import requests
import json
import os
# Clear any proxy settings that might affect OpenAI
if "http_proxy" in os.environ:
    del os.environ["http_proxy"]
if "https_proxy" in os.environ:
    del os.environ["https_proxy"]
if "HTTP_PROXY" in os.environ:
    del os.environ["HTTP_PROXY"]
if "HTTPS_PROXY" in os.environ:
    del os.environ["HTTPS_PROXY"]

import warnings
from PIL import Image
import numpy as np
import cv2

# Import things in the right order to minimize warnings
import sys
from dotenv import load_dotenv
load_dotenv()

# Import openai with the correct version-specific approach
import openai

# Import the custom OCR wrapper
from ocr_wrapper import OCRWrapper

from streamlit_drawable_canvas import st_canvas

# Configure OpenAI API key with a failsafe approach
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    st.error("No OpenAI API key found. Please add it to your .env file.")

# Set API key directly (v0.28.0 style)
openai.api_key = openai_api_key

# Initialize session state if not already done
if 'page_state' not in st.session_state:
    st.session_state.page_state = 'setup'
if 'word_data' not in st.session_state:
    st.session_state.word_data = None
if 'current_sentence' not in st.session_state:
    st.session_state.current_sentence = {"english": "", "japanese": ""}
if 'ocr_result' not in st.session_state:
    st.session_state.ocr_result = None
if 'grade_result' not in st.session_state:
    st.session_state.grade_result = None

# Initialize MangaOCR with better error handling
@st.cache_resource
def load_ocr():
    try:
        return OCRWrapper()
    except Exception as e:
        st.error(f"Error loading OCR: {e}")
        return None

# Function to fetch word data from the existing API with pagination
def fetch_word_data(group_id="1"):
    try:
        # Initialize an empty list to store words from all pages
        all_words = []
        current_page = 1
        total_pages = 1  # Will be updated from the first API call
        
        # Fetch first page to get total_pages
        response = requests.get(f"http://127.0.0.1:5000/groups/{group_id}/words?page={current_page}")
        if response.status_code == 200:
            data = response.json()
            all_words.extend(data["words"])
            total_pages = data["total_pages"]
            
            # Fetch remaining pages
            for page in range(2, total_pages + 1):
                response = requests.get(f"http://127.0.0.1:5000/groups/{group_id}/words?page={page}")
                if response.status_code == 200:
                    page_data = response.json()
                    all_words.extend(page_data["words"])
                else:
                    st.warning(f"Could not fetch page {page}")
            
            # Create a complete response object with all words
            complete_data = {
                "current_page": current_page,
                "total_pages": total_pages,
                "words": all_words
            }
            return complete_data
        else:
            st.error(f"Failed to fetch word data: {response.text}")
            return None
    except Exception as e:
        st.error(f"Error fetching word data: {str(e)}")
        return None

# Add a fallback function for offline sentence generation
def generate_sentence_offline(word_data):
    if not word_data or not word_data.get("words"):
        return {"english": "Error: No word data available", "japanese": ""}
    
    # Randomly select a word from the words array
    import random
    word = random.choice(word_data["words"])
    
    # Simple template-based sentence generation
    templates = [
        {"english": "I like {}", "japanese": "私は{}が好きです。"},
        {"english": "This is a {}", "japanese": "これは{}です。"},
        {"english": "I have a {}", "japanese": "私は{}を持っています。"},
        {"english": "I want a {}", "japanese": "私は{}が欲しいです。"},
        {"english": "I see a {}", "japanese": "私は{}を見ます。"}
    ]
    
    # Select a random template
    template = random.choice(templates)
    
    # Fill in the template with the word
    return {
        "english": template["english"].format(word["english"]),
        "japanese": template["japanese"].format(word["kanji"])
    }

# Function to generate a sentence using GPT-4o
def generate_sentence(word_data):
    if not word_data or not word_data.get("words"):
        return {"english": "Error: No word data available", "japanese": ""}
    
    # Randomly select a word from the words array
    import random
    word = random.choice(word_data["words"])
    
    if not openai.api_key:
        # Fall back to offline generation if no API key
        st.warning("No OpenAI API key found. Using offline sentence generation.")
        return generate_sentence_offline(word_data)
        
    try:
        prompt = f"""Generate a simple Japanese sentence using the word: '{word['kanji']}' ({word['english']}). 
        Keep grammar within JLPT N5 level. Use simple vocabulary.
        Return ONLY a JSON object with the following format:
        {{
            "japanese": "The Japanese sentence",
            "english": "The English translation"
        }}
        """
        
        # Use the v0.28.0 API style
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful Japanese language teaching assistant."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Parse response - note the different access pattern
        content = response['choices'][0]['message']['content']
        result = json.loads(content)
        return result
    except Exception as e:
        error_msg = str(e)
        if "quota" in error_msg.lower():
            st.warning("""
            Your OpenAI API key has exceeded its quota. Switching to offline sentence generation.
            To use AI-generated sentences:
            1. Check your OpenAI account billing settings at https://platform.openai.com/account/billing
            2. Update your API key in the .env file with a working key
            3. Restart the application
            """)
            # Fall back to the offline generation
            return generate_sentence_offline(word_data)
        else:
            st.error(f"Error generating sentence: {error_msg}")
            # Fall back to offline generation for other errors too
            st.warning("Using offline sentence generation due to API error.")
            return generate_sentence_offline(word_data)

# Function to generate a single word for translation practice
def generate_word(word_data):
    if not word_data or not word_data.get("words"):
        return {"english": "Error: No word data available", "japanese": ""}
    
    import random
    
    # First, try to find substantives (nouns) by filtering out words that start with "to "
    # which are likely verbs
    nouns = [word for word in word_data["words"] if not word["english"].startswith("to ")]
    
    # If we have nouns, prioritize them (80% chance of selecting a noun)
    if nouns and random.random() < 0.8:
        word = random.choice(nouns)
    else:
        # Otherwise select any random word
        word = random.choice(word_data["words"])
    
    # Process the English translation - remove "to " prefix if it's a verb
    english = word["english"]
    if english.startswith("to "):
        english = english[3:]
    
    # Return the word in the same format as sentences for compatibility
    return {
        "english": english,
        "japanese": word["kanji"]
    }

# Function to preprocess image for OCR
def preprocess_image(image):
    # Convert to numpy array if it's not already
    if isinstance(image, Image.Image):
        # Ensure the image is in RGB mode (not RGBA or other formats)
        if image.mode == 'RGBA':
            # Convert RGBA to RGB by removing alpha channel
            image = image.convert('RGB')
        elif image.mode != 'RGB' and image.mode != 'L':
            # Convert any other mode to RGB
            image = image.convert('RGB')
        
        image_np = np.array(image)
    else:
        image_np = image
    
    # Convert to grayscale if it's a color image
    if len(image_np.shape) == 3:
        if image_np.shape[2] == 3:  # RGB
            gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        elif image_np.shape[2] == 4:  # RGBA
            # First convert RGBA to RGB, then to grayscale
            rgb = image_np[:, :, :3]
            gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        else:
            # For any other channel configuration, flatten to grayscale
            gray = np.mean(image_np, axis=2).astype(np.uint8)
    else:
        # Already grayscale, ensure it's uint8
        gray = image_np.astype(np.uint8)
    
    # Make sure it's the right type for adaptiveThreshold
    if gray.dtype != np.uint8:
        gray = gray.astype(np.uint8)
    
    # Resize the image to improve OCR results if it's too small or too large
    h, w = gray.shape
    target_height = 900  # Target height for better OCR performance
    if h < 300 or h > 1200:
        scale_factor = target_height / h
        new_width = int(w * scale_factor)
        gray = cv2.resize(gray, (new_width, target_height), interpolation=cv2.INTER_CUBIC)
    
    # Enhance contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)
    
    # Denoise the image
    gray = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    
    # Apply sharpening
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    gray = cv2.filter2D(gray, -1, kernel)
    
    # Apply adaptive thresholding
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
    
    # Perform morphological operations to clean up the image
    kernel = np.ones((2, 2), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=1)
    
    # Invert back to black text on white background
    thresh = cv2.bitwise_not(thresh)
    
    # Convert back to PIL Image for MangaOCR
    return Image.fromarray(thresh)

# Function to grade OCR result with offline fallback
def grade_submission(ocr_text, expected_japanese):
    # Normalize both texts by stripping whitespace
    ocr_text_normalized = ocr_text.strip() if ocr_text else ""
    expected_normalized = expected_japanese.strip() if expected_japanese else ""
    
    # Check for exact match first (after normalization)
    if ocr_text_normalized == expected_normalized:
        return {
            "grade": "S",
            "accuracy_percentage": 100,
            "feedback": "Perfect match! Your writing is excellent.",
            "corrected_text": expected_japanese
        }
    
    # If API key is not available or quota exceeded, use simple comparison logic
    if not openai.api_key:
        return simple_grade_submission(ocr_text, expected_japanese)
        
    try:
        prompt = f"""
        Grade this Japanese writing practice submission:
        
        Expected Japanese text: {expected_japanese}
        OCR detected text: {ocr_text}
        
        Provide a detailed assessment in JSON format:
        {{
            "grade": "S/A/B/C/D/F", 
            "accuracy_percentage": 0-100,
            "feedback": "detailed feedback on errors and improvements",
            "corrected_text": "corrected version if there were errors"
        }}
        
        S grade is perfect, A is excellent with minor issues, B is good, C is average with several errors, 
        D is poor with significant errors, F is failed attempt.
        """
        
        # Use the v0.28.0 API style
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a Japanese language teacher expert in grading handwritten Japanese."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Parse response - note the different access pattern
        content = response['choices'][0]['message']['content']
        result = json.loads(content)
        return result
        
    except Exception as e:
        error_msg = str(e)
        if "quota" in error_msg.lower():
            st.warning("OpenAI API quota exceeded. Using basic grading algorithm.")
            return simple_grade_submission(ocr_text, expected_japanese)
        else:
            st.error(f"Error grading submission: {error_msg}")
            return simple_grade_submission(ocr_text, expected_japanese)

# Simple grading function for when API is unavailable
def simple_grade_submission(ocr_text, expected_japanese):
    # Simple character-by-character comparison
    ocr_text = ocr_text.strip() if ocr_text else ""
    expected = expected_japanese.strip() if expected_japanese else ""
    
    if not ocr_text:
        return {
            "grade": "F",
            "accuracy_percentage": 0,
            "feedback": "No text was detected. Please try again with clearer writing.",
            "corrected_text": expected
        }
    
    if ocr_text == expected:
        return {
            "grade": "S",
            "accuracy_percentage": 100,
            "feedback": "Perfect match! Your writing is excellent.",
            "corrected_text": expected
        }
    
    # Calculate similarity percentage
    max_len = max(len(ocr_text), len(expected))
    if max_len == 0:
        accuracy = 0
    else:
        # Count matching characters
        matches = sum(1 for a, b in zip(ocr_text, expected) if a == b)
        # Calculate percentage, adjust for length differences
        length_diff = abs(len(ocr_text) - len(expected))
        accuracy = int((matches / max_len) * 100) - (length_diff * 5)
        accuracy = max(0, min(accuracy, 100))  # Keep within 0-100 range
    
    # Determine grade based on accuracy
    grade = "F"
    if accuracy >= 95:
        grade = "S"
    elif accuracy >= 85:
        grade = "A"
    elif accuracy >= 75:
        grade = "B"
    elif accuracy >= 60:
        grade = "C"
    elif accuracy >= 40:
        grade = "D"
    
    feedback = f"Your submission matched approximately {accuracy}% of the expected text."
    
    return {
        "grade": grade,
        "accuracy_percentage": accuracy,
        "feedback": feedback,
        "corrected_text": expected
    }

# Function to handle state transitions
def change_state(new_state):
    st.session_state.page_state = new_state

# Allow the user to select a word or a sentence
def select_text():
    col1, col2 = st.columns(2)
    with col1:
        word_button = st.button("Generate Word", key="word_button", use_container_width=True)
    with col2:
        sentence_button = st.button("Generate Sentence", key="sentence_button", use_container_width=True)
    
    if word_button:
        return "word"
    elif sentence_button:
        return "sentence"
    else:
        return None

# Make the canvas wider and reduce the height of the box
def style_canvas():
    return """
    <style>
      .canvas {
        width: 800px;
        height: 200px;
      }
    </style>
    """

# App title
st.title("Japanese Writing Practice")

# Main app logic based on current state
if st.session_state.page_state == 'setup':
    st.subheader("Welcome to Japanese Writing Practice")
    st.write("Select what you would like to practice:")
    
    # Fetch word data if not already done
    if st.session_state.word_data is None:
        st.session_state.word_data = fetch_word_data()
    
    # Select text type via buttons
    selection = select_text()
    
    if selection == "word":
        with st.spinner("Generating word..."):
            st.session_state.current_sentence = generate_word(st.session_state.word_data)
            st.session_state.text_type = "word"
            change_state('practice')
    elif selection == "sentence":
        with st.spinner("Generating sentence..."):
            st.session_state.current_sentence = generate_sentence(st.session_state.word_data)
            st.session_state.text_type = "sentence"
            change_state('practice')

elif st.session_state.page_state == 'practice':
    # Get text type (default to "sentence" for backward compatibility)
    text_type = st.session_state.get("text_type", "sentence")
    
    # Display the English text to be written in Japanese
    st.subheader("Practice Writing")
    st.write(f"**Write this {text_type} in Japanese:**")
    st.write(f"*{st.session_state.current_sentence['english']}*")
    
    # Create tabs for the two input methods
    tab1, tab2 = st.tabs(["Draw", "Upload Image"])
    
    with tab1:
        # Canvas for drawing
        st.write("Draw the Japanese characters below:")
        
        # Add stroke width selection
        stroke_width = st.select_slider(
            "Stroke width:",
            options=[1, 3, 5],
            value=3,
            format_func=lambda x: {1: "Thin", 3: "Medium", 5: "Thick"}[x]
        )
        
        # Add color selection
        stroke_color = st.radio(
            "Stroke color:",
            options=["Black", "Red"],
            horizontal=True,
            format_func=lambda x: x
        )
        
        # Map color selection to RGBA values
        color_map = {
            "Black": "rgba(0, 0, 0, 1)",
            "Red": "rgba(255, 0, 0, 1)"
        }
        
        # Create canvas with selected options
        canvas_result = st_canvas(
            fill_color="rgba(255, 255, 255, 1)",
            stroke_width=stroke_width,
            stroke_color=color_map[stroke_color],
            background_color="rgba(255, 255, 255, 1)",
            width=500,
            height=300,
            drawing_mode="freedraw",
            key="canvas",
        )
    
    with tab2:
        # Upload image
        st.write("Or upload an image of your handwritten Japanese:")
        uploaded_file = st.file_uploader("Choose an image...", type=["jpg", "jpeg", "png"])
        
        # Add manual entry option as a fallback
        st.write("Or type directly if OCR doesn't work:")
        manual_entry = st.text_input("Type Japanese text here:", "")

    # Submit button
    if st.button("Submit for Review"):
        with st.spinner("Processing submission..."):
            # Initialize OCR
            ocr = load_ocr()
            
            # Process either the canvas or uploaded image
            if tab1 and canvas_result.image_data is not None:
                # Get the drawing from the canvas
                img_data = canvas_result.image_data
                # Convert to PIL Image
                image = Image.fromarray(img_data.astype('uint8'))
                # Preprocess image
                processed_image = preprocess_image(image)
                
                # Show debug view of processed image
                col1, col2 = st.columns(2)
                with col1:
                    st.write("Original Image:")
                    st.image(image, use_column_width=True)
                with col2:
                    st.write("Processed Image for OCR:")
                    st.image(processed_image, use_column_width=True)
                
                # Run OCR
                st.session_state.ocr_result = ocr(processed_image)
                st.write("OCR detected text:", st.session_state.ocr_result)
                
            elif tab2 and uploaded_file is not None:
                try:
                    # Read the file bytes directly
                    img_bytes = uploaded_file.read()
                    uploaded_file.seek(0)  # Reset for next read
        
                    # Now open with PIL with error handling
                    import io
                    image = Image.open(io.BytesIO(img_bytes))
        
                    # Check image mode and convert to grayscale for consistency
                    if image.mode == 'RGBA':
                        image = image.convert('RGB')  # First convert RGBA to RGB
                    
                    # Display original image first to verify it loaded correctly
                    st.write("Original Uploaded Image:")
                    st.image(image, caption="Your uploaded image", use_column_width=True)
                    
                    # Also show the grayscale version that will be used for OCR
                    st.write("Grayscale Version:")
                    grayscale_image = image.convert('L')
                    st.image(grayscale_image, caption="Grayscale version for OCR", use_column_width=True)
        
                    # Make a copy for processing
                    img_for_processing = image.copy()
        
                    # Preprocess image
                    processed_image = preprocess_image(img_for_processing)
        
                    # Show debug view of processed image
                    col1, col2 = st.columns(2)
                    with col1:
                        st.write("Original Image:")
                        # Check image mode and convert to grayscale if necessary
                        if img_for_processing.mode != 'L':
                            st.image(img_for_processing.convert('L'), use_column_width=True)
                        else:
                            st.image(img_for_processing, use_column_width=True)
                    with col2:
                        st.write("Processed Image for OCR:")
                        st.image(processed_image, use_column_width=True)  # Display the processed PIL Image object
        
                    # Run OCR
                    st.session_state.ocr_result = ocr(processed_image)
                    st.write("OCR detected text:", st.session_state.ocr_result)
        
                except Exception as e:
                    st.error(f"Error processing uploaded image: {str(e)}")
                    st.error("Please try another image file or use manual entry.")
                    
                    # Check if manual entry is provided as fallback
                    if manual_entry:
                        st.info("Using manual entry instead of OCR.")
                        st.session_state.ocr_result = manual_entry
                    else:
                        submit_valid = False
            
            # Use manual entry if provided (even if no image was uploaded)
            elif tab2 and manual_entry:
                st.info("Using manual text entry.")
                st.session_state.ocr_result = manual_entry
                
            else:
                st.error("Please draw, upload an image, or enter text manually before submitting.")
                # Replace "return" with a flag to skip the rest of processing
                submit_valid = False
            
            # Only proceed with grading if we have valid submission
            if 'submit_valid' not in locals() or submit_valid != False:
                # Grade the submission
                st.session_state.grade_result = grade_submission(
                    st.session_state.ocr_result,
                    st.session_state.current_sentence['japanese']
                )
                
                # Transition to review state
                change_state('review')

elif st.session_state.page_state == 'review':
    # Get text type (default to "sentence" for backward compatibility)
    text_type = st.session_state.get("text_type", "sentence")
    
    # Display review and feedback
    st.subheader("Review & Feedback")
    
    # Original text
    st.write(f"**Original {text_type.capitalize()}:**")
    st.write(f"English: *{st.session_state.current_sentence['english']}*")
    st.write(f"Expected Japanese: *{st.session_state.current_sentence['japanese']}*")
    
    # OCR result
    st.write("**Your Submission (OCR Result):**")
    st.write(st.session_state.ocr_result)
    
    # Grading
    st.write("**Grading Result:**")
    grade = st.session_state.grade_result
    
    # Display grade with fancy formatting
    grade_color = {
        "S": "green",
        "A": "green",
        "B": "blue",
        "C": "orange",
        "D": "red",
        "F": "red"
    }.get(grade["grade"], "gray")
    
    st.markdown(f"""
    <div style="padding: 10px; border-radius: 5px; background-color: {grade_color}; color: white;">
        <h1 style="text-align: center; margin: 0;">{grade["grade"]}</h1>
        <p style="text-align: center; margin: 0;">{grade["accuracy_percentage"]}% Accuracy</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Feedback
    st.write("**Feedback:**")
    st.write(grade["feedback"])
    
    # Corrected text if available
    if grade["corrected_text"]:
        st.write("**Corrected Japanese:**")
        st.write(grade["corrected_text"])
    
    # Button to try another
    if st.button("Next Question"):
        change_state('setup')  # Go back to setup to let user choose again

# Footer with app information
st.markdown("---")
st.caption("Japanese Writing Practice App - Practice your Japanese writing skills with AI feedback")
