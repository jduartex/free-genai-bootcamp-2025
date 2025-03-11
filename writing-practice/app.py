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

# Function to generate a sentence using GPT-4o
def generate_sentence(word_data):
    if not word_data or not word_data.get("words"):
        return {"english": "Error: No word data available", "japanese": ""}
    
    # Randomly select a word from the words array
    import random
    word = random.choice(word_data["words"])
    
    if not openai.api_key:
        return {"english": "Error: OpenAI API key is not set", "japanese": ""}
        
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
            st.error("""
            Your OpenAI API key has exceeded its quota. Please:
            1. Check your OpenAI account billing settings at https://platform.openai.com/account/billing
            2. Update your API key in the .env file with a working key
            3. Restart the application
            """)
            return {"english": "Error: OpenAI API quota exceeded. Please update your API key in the .env file.", "japanese": ""}
        else:
            st.error(f"Error generating sentence: {error_msg}")
            return {"english": f"Error generating sentence: {error_msg}", "japanese": ""}

# Function to preprocess image for OCR
def preprocess_image(image):
    # Convert to numpy array if it's not already
    if isinstance(image, Image.Image):
        image_np = np.array(image)
    else:
        image_np = image
    
    # Convert to grayscale if it's a color image
    if len(image_np.shape) == 3 and image_np.shape[2] == 3:
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
    else:
        gray = image_np
    
    # Apply adaptive thresholding
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
    
    # Invert back to black text on white background
    thresh = cv2.bitwise_not(thresh)
    
    # Convert back to PIL Image for MangaOCR
    return Image.fromarray(thresh)

# Function to grade OCR result
def grade_submission(ocr_text, expected_japanese):
    if not openai.api_key:
        return {
            "grade": "F", 
            "accuracy_percentage": 0,
            "feedback": "OpenAI API key is not set",
            "corrected_text": ""
        }
        
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
            st.error("""
            Your OpenAI API key has exceeded its quota. Please:
            1. Check your OpenAI account billing settings at https://platform.openai.com/account/billing
            2. Update your API key in the .env file with a working key
            3. Restart the application
            """)
            return {
                "grade": "F",
                "accuracy_percentage": 0,
                "feedback": "Error: OpenAI API quota exceeded. Please update your API key.",
                "corrected_text": ""
            }
        else:
            st.error(f"Error grading submission: {error_msg}")
            return {
                "grade": "F", 
                "accuracy_percentage": 0,
                "feedback": f"Error in grading process: {error_msg}",
                "corrected_text": ""
            }

# Function to handle state transitions
def change_state(new_state):
    st.session_state.page_state = new_state

# App title
st.title("Japanese Writing Practice")

# Main app logic based on current state
if st.session_state.page_state == 'setup':
    st.subheader("Welcome to Japanese Writing Practice")
    st.write("Click the button below to generate a sentence to practice writing in Japanese.")
    
    # Fetch word data if not already done
    if st.session_state.word_data is None:
        st.session_state.word_data = fetch_word_data()
    
    # Generate button
    if st.button("Generate Sentence"):
        with st.spinner("Generating sentence..."):
            st.session_state.current_sentence = generate_sentence(st.session_state.word_data)
            change_state('practice')

elif st.session_state.page_state == 'practice':
    # Display the English sentence to be written in Japanese
    st.subheader("Practice Writing")
    st.write(f"**Write this sentence in Japanese:**")
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
                # Run OCR
                st.session_state.ocr_result = ocr(processed_image)
                
            elif tab2 and uploaded_file is not None:
                # Read the uploaded file
                image = Image.open(uploaded_file)
                # Preprocess image
                processed_image = preprocess_image(image)
                # Run OCR
                st.session_state.ocr_result = ocr(processed_image)
            
            else:
                st.error("Please draw or upload an image before submitting.")
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
    # Display review and feedback
    st.subheader("Review & Feedback")
    
    # Original sentence
    st.write("**Original Sentence:**")
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
    
    # Button to try another sentence
    if st.button("Next Question"):
        # Generate a new sentence
        with st.spinner("Generating new sentence..."):
            st.session_state.current_sentence = generate_sentence(st.session_state.word_data)
            st.session_state.ocr_result = None
            st.session_state.grade_result = None
            change_state('practice')

# Footer with app information
st.markdown("---")
st.caption("Japanese Writing Practice App - Practice your Japanese writing skills with AI feedback")
