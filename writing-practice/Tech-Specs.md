# Japanese Writing Practice Application

## Business Goal
Students have asked if there could be a learning exercise to practice writing language sentences.
You have been tasked to build a prototyping application which will take a word group, and generate very simple sentences in english, and you must write them in Japanese.

## Technical Requirements
- Streamlit
- MangaOCR (Japanese) or for another language use Managed LLM that has Vision eg. GPT4o
- Be able to upload an image

## Enhanced Technical Specifications

### API Consumption

The application will consume an existing API at `http://127.0.0.1:5000/groups/:id/words` which provides Japanese vocabulary data with pagination. The API is expected to return data in the following format:

**Expected JSON Structure:**
```json
{
  "current_page": 1,
  "total_pages": 6,
  "words": [
    {
      "correct_count": 0,
      "english": "to give",
      "id": 26,
      "kanji": "あげる",
      "romaji": "ageru",
      "wrong_count": 0
    },
    {
      "correct_count": 0,
      "english": "to do",
      "id": 11,
      "kanji": "する",
      "romaji": "suru",
      "wrong_count": 0
    }
    // Additional words...
  ]
}
```

### Initialization Step

When the application initializes, it should:

- Fetch word data from GET http://127.0.0.1:5000/groups/:id/words, which returns a paginated JSON collection of Japanese words with their English translations.
- Store this collection in memory for quick access.
- Handle pagination by fetching multiple pages if necessary or allowing the user to navigate between pages.
- Optionally, implement caching to prevent unnecessary API calls.

### Page States

#### 1. Setup State

**User Interface:**
- A single button labeled "Generate Sentence".

**Behavior:**
- When the user presses the button, the app generates a sentence using the Sentence Generator LLM.
- Transition to Practice State after sentence generation.

#### 2. Practice State

**User Interface:**
- Displays an English sentence.
- Provides two input options for users:
  - An upload field to submit an image
  - A canvas where users can draw Japanese characters using their mouse or finger
- A button labeled "Submit for Review".

**Canvas Implementation:**
- Canvas size: 500x300 pixels (responsive on different devices)
- Features:
  - Clear button to reset the canvas
  - Simple color selection (black and red)
  - Stroke width selection (thin, medium, thick)
  - White background for better OCR results
- Implementation suggestion: Use Streamlit-drawable-canvas library

**Behavior:**
- User chooses either to upload an image containing handwritten Japanese text or draw directly on the canvas.
- Upon clicking "Submit for Review", the app sends either the uploaded image or the canvas drawing to the Grading System.
- Transition to Review State after processing.

#### 3. Review State

**User Interface:**
- Displays the original English sentence.
- Removes the upload field.
- Shows grading results:
  - Transcription of Image (using OCR).
  - Translation of Transcription (using LLM).
  - Grading:
    - A letter score based on S-Rank grading system.
    - A detailed evaluation of accuracy and improvement suggestions.
- A button labeled "Next Question".

**Behavior:**
- Clicking "Next Question" generates a new sentence and transitions back to Practice State.

### Sentence Generator LLM

**Prompt Template:** "Generate a simple Japanese sentence using the word: {{word}}. Keep grammar within JLPT N5 level. Use simple vocabulary:

- Objects: book, car, ramen, sushi
- Verbs: to drink, to eat, to meet
- Time expressions: tomorrow, today, yesterday."

**Enhancements:**
- Use a diverse vocabulary set to reduce repetition.
- Ensure the sentence structure aligns with N5 grammar rules.

**LLM Integration:**
- Recommended model: OpenAI GPT-4o as the simplest to implement
- Implementation: Use the OpenAI Python library with an API key stored in environment variables
- Fallback option: HuggingFace's free inference endpoints if OpenAI integration is not possible

### Grading System

**Steps:**
1. Transcription: Extract handwritten Japanese text using MangaOCR.
   - OCR Processing: Implement preprocessing to handle various inputs:
     - Convert images to grayscale
     - Apply adaptive thresholding to handle different lighting conditions
     - For canvas drawings: save as PNG with white background and black text
     - For uploaded images: apply contrast enhancement if needed
2. Translation: Use an LLM to produce a literal English translation.
3. Grading:
   - Compare the user's response against the expected sentence.
   - Assign an S-Rank letter grade (S, A, B, C, D, F).
   - Provide detailed feedback:
     - Highlight missing or incorrect words.
     - Suggest correct grammar or vocabulary usage.
     - Optionally, offer a corrected version of the sentence.
   - Return data to the frontend.

### Device Support and Responsiveness
- Focus exclusively on web desktop browsers (Chrome, Firefox, Safari) for the initial version
- Designed for standard desktop resolutions (1024x768 and higher)
- Mobile and tablet support will be considered for future versions

### User Data Management
- In-memory storage only: Store all user data in Streamlit's session state
- No persistent storage between browser sessions
- All user progress and data will be lost when the browser is closed or refreshed

### MVP Requirements vs. Future Enhancements

**MVP (Core Requirements):**
- API integration with existing vocabulary service
- Sentence generation functionality
- Practice interface with both image upload and drawing canvas
- Basic OCR integration for Japanese text recognition
- Simple grading and feedback system
- Desktop web browser support only
- In-memory user data storage

**Future Enhancements (Not part of MVP):**
- All items listed under "Potential Optimizations"
- Advanced canvas features (undo, different brushes)
- User account system with persistent storage
- Mobile and tablet support
- Offline support

### Potential Optimizations

- **Preloading Sentences:** Cache a set of generated sentences in advance to reduce LLM latency.
- **Offline Mode:** Allow users to practice with preloaded words when offline.
- **User Performance Tracking:**
  - Track progress and identify weak areas.
  - Suggest specific practice words based on previous mistakes.
- **Gamification:**
  - Reward users with badges for achieving milestones.
  - Introduce a daily practice streak system.
