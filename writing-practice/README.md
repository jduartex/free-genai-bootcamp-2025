# Japanese Writing Practice Application

This application helps students practice writing Japanese sentences by providing English sentences to translate, a canvas to draw or upload handwritten Japanese text, and AI-powered feedback on their writing.

## Setup Instructions

1. Clone this repository
2. Ensure you have Python 3.10 installed:
   ```bash
   # Check your Python version
   python3 --version
   
   # If you don't have Python 3.10, install it using your package manager
   # For macOS with Homebrew:
   # brew install python@3.10
   
   # For Ubuntu/Debian:
   # sudo apt install python3.10 python3.10-venv
   ```
   
3. Create and activate a virtual environment with Python 3.10:
   ```bash
   # Create a virtual environment with Python 3.10
   # On macOS/Linux:
   python3.10 -m venv venv
   
   # On Windows (if python3.10 is in your PATH):
   python3.10 -m venv venv
   # OR specify the full path:
   # C:\Path\to\Python310\python.exe -m venv venv
   
   # Activate the virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
   
4. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file based on `.env.example` and add your OpenAI API key
6. Ensure the vocabulary API is running at localhost:5000
7. Start the Streamlit app:
   ```bash
   streamlit run app.py
   ```

## How the Application Works

The application flows through three main states:

**Note:** The diagrams below use Mermaid syntax and will render automatically when viewed on GitHub. If viewing locally, you can copy and paste the code into a Mermaid live editor at https://mermaid.live to see the visualization.

```mermaid
flowchart TD
    A[Initialize App] --> B[Setup State]
    B -->|"Click 'Generate Sentence'"| C[Practice State]
    C -->|"Click 'Submit for Review'"| D[Review State]
    D -->|"Click 'Next Question'"| C
    
    style B fill:#f9f,stroke:#333,stroke-width:2px
    style C fill:#bbf,stroke:#333,stroke-width:2px
    style D fill:#bfb,stroke:#333,stroke-width:2px
```

![Application State Flow](https://mermaid.ink/img/pako:eNpVkMFuwjAMhl_F8nFK0Y5DOmCitEKVdpq0w46-RKlFk5ZmURXK3q9hSKvw-f_t37IdVE4ELFwu-JNvPLYDPeS6yXx6-OhHjLOIWYUkQxyR3YCxd1yGVpI_MqMj0Ujjwpczg6vkZrMJ2957Yn-Llu0QjDrfETc-RAi-pgrQ_q3biUEfmB6M9CGarswRapwWKkVHsa5H2bdMwGIoKjdrBxJme7Q-8CstdbXRVKpZe7Rqa7SovvwNmWZdl0VheBXl7miKL-642p9er0_e50FbKJ_mnFmp65gukV8bkXSY5X2gNd_Aw9e6QHFC15u_Wu-r7p0uI2VDMRIb-7_opA6yZwfsgh2wpspSCxpX9gdJZIdY?type=png)

### Detailed Component Interaction

```mermaid
sequenceDiagram
    participant User
    participant UI as Streamlit UI
    participant API as Vocabulary API
    participant LLM as OpenAI GPT-4o
    participant OCR as MangaOCR
    
    Note over User,OCR: Setup Phase
    User->>UI: Open application
    UI->>API: Fetch vocabulary words
    API-->>UI: Return words data
    
    Note over User,OCR: Practice Phase
    User->>UI: Click "Generate Sentence"
    UI->>LLM: Request sentence with random word
    LLM-->>UI: Return English & Japanese sentence
    UI-->>User: Display English sentence to write
    
    alt Draw Option
        User->>UI: Draw Japanese characters on canvas
    else Upload Option
        User->>UI: Upload image of handwriting
    end
    
    User->>UI: Click "Submit for Review"
    UI->>OCR: Process image/drawing
    OCR-->>UI: Return detected text
    UI->>LLM: Request grading comparison
    LLM-->>UI: Return grade & feedback
    
    Note over User,OCR: Review Phase
    UI-->>User: Display results, grade & feedback
    User->>UI: Click "Next Question"
    
    Note over User,OCR: Cycle repeats
```

![Component Interaction](https://mermaid.ink/img/pako:eNqNk89v2jAUx_-VJ56SyviRhKZSVEDraLuqU7Wl7VFVhezkJVhN7MwxoUz7v-8lhJVCq-4U-_v9fO_5OScmCivGSUQkLvlZLQ2dO2Gf5CqT6f7nz8LR9-Oew45CiN0B406XnUBncqme8Jq7jMGRfd8b9X2v3x_4vZHLP3eMsGJt4NQZf-uNPoPpah32weiyJOdYMmQRw8nzRBupsjLB5xXJdcZu5BfnndOj0yNnI_Uq2W3IMAmErk1KI6H1xmhSIYwsJRdWCiM09ImwkKttiiEwYeRJCrMhm5UWlfpt9KpS2-1G14dUyH9UW7I2tulNlt9ppkqjsrXUKjtJVT4ziqodU5wKLCvkchnGkJMEW-7S4WLqGYUfP1sjmIiUoBaXZah-KFyTUE7Cf-pEiSpZJGt-r_MdDu4Ju7rKuvXSlVQ6XZGiW-YbVZoOWZncnhi1S-3gK5qnYG8dtNrgx1TYhYE70hly6dfi1m6KWj5N1AsM3Io3fOd8e7jE2qVGcdNw53SZqPQ1fEjlQ5cswi3i0git94IIl2nM39Nca03kMc4T5Njf3iAhIsXZMs5XP7pZ4PXPrsdNgcvM9vtNzXh-nSFFW0wAMOzXM_G967udAZ1F2Cn-EuR3eHoGOTjD_dEZXPSvr6Df108SPvhJsutNN9495hRCMWHZMyGwW-RzUgZmRtQpeTaYrl9QzUlUPGwrBWEo0cxPiMnETD2jKj6j4NQp3A3nkoRG4juJSAIxHUETaUjeZT-QXBTlnBpcDkj7rXtA0Ubl5kjIZoBBRlrMxv8DbqmDMg?type=png)

### Fallback Mechanism

When the OpenAI API quota is exceeded, the application automatically switches to a template-based approach:

```mermaid
flowchart LR
    A[Generate Sentence Request] --> B{API Quota Available?}
    B -->|Yes| C[Use GPT-4o]
    B -->|No| D[Use Template-Based Fallback]
    C --> E[Return Sentence]
    D --> E
    
    style D fill:#ff9,stroke:#333,stroke-width:2px
```

![Fallback Mechanism](https://mermaid.ink/img/pako:eNpVkD1vwjAQhv-KdTMoCR8ZYKhEUkQVOiF1YDQxl9jCsS3bQUDEf-8FgkA9vXf3vnfnq1EFEbBwueAv3jg6d3TPdZn56_1jO2GcRcwq5BniimwFzF2GnDeS_IAZnYgmGlc-nRhcJbfbTdj13hP7pK_sRmCzDx1x42OE4Gu9Ae3fuh0Z9JHpwUgfoqnkHKHEeaUkmonlcpR9zQQs-rxys3cgYdaidfFXXOrVRpNcr9ujVVOjRfXlb8g067rMM8OrKK9zU3xxw9X-8nJ5inc-aAvlw5yyUuk6pnPk10oknWZ5F2jND3D3tSpQPNP15q_Wxapbpw-RsqEYiY39B9xiB5M?type=png)

## How to Use

1. Click "Generate Sentence" to get an English sentence
2. Either draw the Japanese translation on the canvas or upload an image
3. Click "Submit for Review" to get feedback on your writing
4. Review your grade and feedback
5. Click "Next Question" to continue practicing

## Technical Details

- The application uses Streamlit for the frontend
- MangaOCR for Japanese text recognition
- OpenAI GPT-4o for sentence generation and grading
- Consumes an external API for Japanese vocabulary data

## Requirements

- Python 3.10 or higher
- OpenAI API key
- Access to the vocabulary API at localhost:5000
- Internet connection for API calls

## Troubleshooting

### API Quota Issues

If you encounter the error "You exceeded your current quota, please check your plan and billing details":

1. The application will automatically switch to a fallback mode that uses:
   - Template-based sentence generation instead of OpenAI
   - Simple character matching for grading instead of AI evaluation

2. To resolve the API quota issue and return to full functionality:
   - Go to [OpenAI API Dashboard](https://platform.openai.com/account/usage)
   - Check your current usage and billing status
   - If needed, update your billing information or switch to a paid plan
   - Generate a new API key at [API Keys Page](https://platform.openai.com/account/api-keys)
   - Update your `.env` file with the new key
   - Restart the application

Alternatively, you can use a different OpenAI account with available credits.

### OCR Issues

If the OCR functionality isn't working properly:

1. Ensure you have properly installed manga-ocr and its dependencies
2. Try with clearer handwriting or a higher contrast image
3. Check the console for specific error messages
