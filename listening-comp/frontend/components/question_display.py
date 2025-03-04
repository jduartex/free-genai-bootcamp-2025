import streamlit as st
from typing import List, Dict, Any

def display_questions(questions: List[Dict[str, Any]], auto_play: bool = False, show_furigana: bool = False):
    """Simple quiz display with minimal interactivity"""
    
    # Save questions in session state
    if 'current_quiz_questions' not in st.session_state:
        st.session_state.current_quiz_questions = questions
    
    # Get questions from session state
    current_questions = st.session_state.current_quiz_questions
    
    # Initialize answers if needed
    if 'quiz_answers' not in st.session_state:
        st.session_state.quiz_answers = {}
    
    # Display quiz
    st.write("## Japanese Quiz Questions")
    
    # Display each question
    for i, question in enumerate(current_questions, 1):
        q_key = f"q_{i}"
        
        st.markdown(f"### Question {i}")
        st.write(question.get("question", ""))
        
        options = question.get("options", [])
        if not options:
            continue
        
        # Get current answer or set default
        if q_key not in st.session_state.quiz_answers and options:
            st.session_state.quiz_answers[q_key] = options[0]
        
        # Display options as clickable buttons instead of radio
        st.write("Select your answer:")
        
        # Create a row of buttons for options
        cols = st.columns(len(options))
        for j, option in enumerate(options):
            with cols[j]:
                # Visual indicator if this option is selected
                is_selected = st.session_state.quiz_answers.get(q_key) == option
                button_label = f"✓ {option}" if is_selected else option
                
                if st.button(button_label, key=f"opt_{i}_{j}"):
                    st.session_state.quiz_answers[q_key] = option
        
        # Show current selection
        st.info(f"Selected: {st.session_state.quiz_answers.get(q_key, 'None')}")
        st.markdown("---")
    
    # Check answers button
    if st.button("Check Answers"):
        st.subheader("Results:")
        
        correct_count = 0
        for i, q in enumerate(current_questions, 1):
            q_key = f"q_{i}"
            user_answer = st.session_state.quiz_answers.get(q_key, "")
            correct = q.get("correct_answer", "")
            
            st.write(f"**Question {i}**:")
            if user_answer == correct:
                st.success(f"Correct! Your answer: {user_answer}")
                correct_count += 1
            else:
                st.error(f"Wrong. Your answer: {user_answer}, Correct: {correct}")
                
            if explanation := q.get("explanation"):
                st.info(f"Explanation: {explanation}")
                
            st.markdown("---")
        
        # Show score
        total = len(current_questions)
        score = (correct_count / total) * 100
        st.metric("Your Score", f"{correct_count}/{total} ({score:.1f}%)")
