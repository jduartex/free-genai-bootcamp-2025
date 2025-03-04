import streamlit as st
from typing import List, Dict, Any

def display_questions(questions: List[Dict[str, Any]], auto_play: bool = False, show_furigana: bool = False):
    """Display questions in a structured format"""
    # IMPORTANT: Always use the same key for this component instance
    component_key = "quiz_component"
    
    # ==== STATE INITIALIZATION ====
    # Initialize the component state if not already present
    if component_key not in st.session_state:
        st.session_state[component_key] = {
            "questions": questions,
            "answers": {},
            "checked": {},
            "show_results": False,
        }
    
    # Ensure we have the most recent questions
    if questions:  # Only update if we get non-empty questions
        st.session_state[component_key]["questions"] = questions
    
    # Get state references
    state = st.session_state[component_key]
    current_questions = state["questions"]
    current_answers = state["answers"]
    current_checked = state["checked"]
    
    # Initialize default answers if needed
    for i, question in enumerate(current_questions, 1):
        if options := question.get("options", []):
            if f"q_{i}" not in current_answers:
                current_answers[f"q_{i}"] = options[0]
    
    # Define callback functions to handle button clicks
    def check_answer(i):
        q_key = f"q_{i}"
        state["checked"][q_key] = True
        
    def submit_all():
        # Check all answers
        for i, _ in enumerate(current_questions, 1):
            state["checked"][f"q_{i}"] = True
        state["show_results"] = True
    
    def reset_quiz():
        state["answers"] = {}
        state["checked"] = {}
        state["show_results"] = False
    
    # ==== DISPLAY QUESTIONS ====
    st.write("### Multiple Choice Questions")
    
    for i, question in enumerate(current_questions, 1):
        q_key = f"q_{i}"
        options = question.get("options", [])
        
        # Question container
        with st.container():
            st.write(f"**Question {i}:** {question.get('question', '')}")
            
            if options:
                # Determine current selection
                current_selection = current_answers.get(q_key, options[0])
                
                # Use radio buttons with key that includes question index
                col1, col2 = st.columns([3, 1])
                with col1:
                    # Find index of current answer
                    try:
                        index = options.index(current_selection)
                    except (ValueError, IndexError):
                        index = 0
                        
                    radio_selection = st.radio(
                        "Choose your answer:",
                        options,
                        key=f"radio_{i}",
                        index=index,
                        horizontal=True
                    )
                    
                    # Save selected answer
                    current_answers[q_key] = radio_selection
                
                # Check answer button
                with col2:
                    if st.button("Check", key=f"check_{i}", on_click=check_answer, args=(i,)):
                        pass  # Actual check happens in the callback
                
                # Show result if checked
                if q_key in current_checked:
                    correct = question.get("correct_answer", "")
                    if current_answers[q_key] == correct:
                        st.success("✓ Correct!")
                    else:
                        st.error(f"✗ Incorrect. The correct answer is: **{correct}**")
                    
                    if explanation := question.get("explanation"):
                        with st.expander("See Explanation"):
                            st.write(explanation)
            
            st.markdown("---")
    
    # ==== SUBMIT ANSWERS ====
    col1, col2 = st.columns([3, 1])
    with col2:
        if st.button("Submit All", key="submit_all", on_click=submit_all):
            pass  # Actual submission happens in the callback
    
    # ==== DISPLAY RESULTS ====
    if state["show_results"]:
        st.header("Final Results")
        
        # Calculate score
        correct_count = sum(
            1 for i, q in enumerate(current_questions, 1)
            if current_answers.get(f"q_{i}") == q.get("correct_answer")
        )
        
        # Score display
        total = len(current_questions)
        score = (correct_count / total) * 100 if total > 0 else 0
        st.metric("Your Score", f"{correct_count}/{total} ({score:.1f}%)")
        
        # Reset button
        if st.button("Try Again", key="reset_btn", on_click=reset_quiz):
            pass  # Actual reset happens in the callback
