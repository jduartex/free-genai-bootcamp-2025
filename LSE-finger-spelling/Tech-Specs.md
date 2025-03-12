# Technical Specifications: LSE Sign Language Finger Spelling Recognition App

## 1. Project Overview

### 1.1 Purpose
Develop a simple web application that uses the MacBook Pro camera to recognize the five vowels (A, E, I, O, U) in Spanish Sign Language (LSE).

### 1.2 Features
- Real-time camera access
- Hand detection and tracking
- Recognition of the five vowel signs (A, E, I, O, U)
- Visual display of recognized vowels
- Minimalist user interface

## 2. Technical Stack

### 2.1 Frontend
- Frontend: React.js with Tailwind CSS (using Create React App)

### 2.2 Machine Learning
- Hand Tracking: MediaPipe Hands
- Sign Classification: Simple TensorFlow.js model

## 3. Technical Components

### 3.1 Camera Module
- Access MacBook Pro camera using browser's MediaDevices API
- Display live video feed

### 3.2 Hand Detection
- Use MediaPipe Hands to track hand landmarks
- Extract key points representing finger positions

### 3.3 Vowel Recognition
- Simplified classifier that focuses only on the five vowel hand shapes
- Template matching approach for each vowel sign

### 3.4 User Interface
- Minimalist design with camera feed and results display
- Large text showing the currently recognized vowel
- Simple accuracy indicator

## 4. Development Approach

### 4.1 Model Training
- Using existing free datasets for the five vowel signs in LSE
- Focus on different hand sizes and lighting conditions

### 4.2 Implementation
- Built using Create React App
- All processing done in the browser
- No server or backend required

### 4.3 Evaluation Metrics
- Accuracy: Percentage of correctly identified signs
- Precision: Correct positive predictions divided by total positive predictions
- Recall: Correct positive predictions divided by total actual positives
- F1 Score: Harmonic mean of precision and recall
- Latency: Time taken to process and identify each sign

## 5. Limitations
- Limited to the five vowels only
- Requires good lighting conditions
- Best performance with clear hand positioning

## 6. Deployment
- Host as a simple static website
- Access via any modern browser on the MacBook Pro

## 7. Privacy Considerations
- Clear notification to users about camera access requirements
- All processing performed locally on the device with no data sent to external servers
- No storage of video or image data from the camera feed
- Option to disable camera access when not in use
- Transparency about data usage in terms of service

## 8. System Requirements
- MacBook Pro with working built-in camera
- Modern web browser with WebRTC support (Chrome, Safari, Firefox)
- Adequate lighting for optimal hand tracking