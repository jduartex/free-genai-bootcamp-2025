import sqlite3
import os
import json
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import numpy as np

try:
    import pandas as pd  # Ensure pandas is imported
except ImportError:
    print("Error: pandas library is not installed. Please install it using 'pip install pandas'")
    pd = None  # Set pd to None to prevent further errors

from collections import defaultdict
import tempfile

class PerformanceTracker:
    """Class for analyzing user performance in Japanese listening comprehension."""
    
    def __init__(self, db_path=None):
        """Initialize with database path."""
        if db_path is None:
            # Use default path relative to this file
            self.db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                                      "data/japanese_content.db")
        else:
            self.db_path = db_path
            
        # Default user ID for single-user mode
        self.default_user_id = "default_user"
        
        # Create data directory if it doesn't exist
        os.makedirs(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                               "data"), exist_ok=True)
    
    def connect(self):
        """Connect to the SQLite database."""
        return sqlite3.connect(self.db_path)
    
    def get_performance_over_time(self, days=30, jlpt_level=None):
        """Get performance metrics over time."""
        user_id = self.default_user_id
        
        # Calculate the date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        conn = self.connect()
        cursor = conn.cursor()
        
        # Query to get daily performance
        if jlpt_level:
            cursor.execute("""
                SELECT 
                    date(last_access) as study_date,
                    SUM(questions_attempted) as questions,
                    SUM(questions_correct) as correct,
                    AVG(CASE WHEN completion_time > 0 THEN completion_time ELSE NULL END) as avg_completion_time
                FROM user_progress
                WHERE user_id = ? 
                AND last_access >= ? 
                AND last_access <= ?
                AND jlpt_level = ?
                GROUP BY date(last_access)
                ORDER BY date(last_access)
            """, (user_id, start_date.isoformat(), end_date.isoformat(), jlpt_level))
        else:
            cursor.execute("""
                SELECT 
                    date(last_access) as study_date,
                    SUM(questions_attempted) as questions,
                    SUM(questions_correct) as correct,
                    AVG(CASE WHEN completion_time > 0 THEN completion_time ELSE NULL END) as avg_completion_time
                FROM user_progress
                WHERE user_id = ? 
                AND last_access >= ? 
                AND last_access <= ?
                GROUP BY date(last_access)
                ORDER BY date(last_access)
            """, (user_id, start_date.isoformat(), end_date.isoformat()))
        
        records = cursor.fetchall()
        conn.close()
        
        # Process data
        dates = []
        accuracy_vals = []
        question_counts = []
        times = []
        
        for record in records:
            study_date, questions, correct, avg_time = record
            
            # Calculate accuracy
            accuracy = round(correct / questions * 100, 2) if questions > 0 else 0
            
            dates.append(study_date)
            accuracy_vals.append(accuracy)
            question_counts.append(questions)
            times.append(avg_time if avg_time else 0)
        
        # Calculate trends using simple linear regression if we have enough data
        accuracy_trend = self._calculate_trend(accuracy_vals) if len(accuracy_vals) >= 3 else 0
        time_trend = self._calculate_trend(times) if len(times) >= 3 else 0
        
        return {
            "dates": dates,
            "accuracy": accuracy_vals,
            "question_counts": question_counts,
            "avg_completion_times": times,
            "trends": {
                "accuracy": accuracy_trend,
                "time": time_trend,
                "improvement_indicator": "improving" if accuracy_trend > 0 and time_trend < 0 else 
                                        "declining" if accuracy_trend < 0 else 
                                        "mixed"
            }
        }
    
    def _calculate_trend(self, values):
        """Calculate the linear trend in a series of values."""
        if not values or len(values) < 2:
            return 0
            
        x = np.arange(len(values))
        y = np.array(values)
        
        # Simple linear regression
        slope = np.polyfit(x, y, 1)[0]
        
        # Normalize by the mean to get relative change
        mean_value = np.mean(values) if np.mean(values) != 0 else 1
        
        return round(slope / mean_value * 100, 2)  # Percentage change per unit
        
    def get_strengths_and_weaknesses(self):
        """Identify user's strengths and weaknesses based on performance data."""
        user_id = self.default_user_id
        
        conn = self.connect()
        cursor = conn.cursor()
        
        # Query to get JLPT level performance
        cursor.execute("""
            SELECT 
                jlpt_level,
                SUM(questions_attempted) as total_questions,
                SUM(questions_correct) as correct_answers
            FROM user_progress
            WHERE user_id = ? AND jlpt_level IS NOT NULL
            GROUP BY jlpt_level
            ORDER BY jlpt_level
        """, (user_id,))
        
        jlpt_records = cursor.fetchall()
        
        # Get more detailed information about grammar and vocabulary from questions
        # This assumes we have detailed tracking of individual questions
        cursor.execute("""
            SELECT 
                q.explanation, 
                COUNT(*) as occurrence,
                SUM(CASE WHEN up.questions_correct > 0 THEN 1 ELSE 0 END) as correct
            FROM questions q
            JOIN user_progress up ON q.transcript_id = up.transcript_id
            WHERE up.user_id = ?
            GROUP BY q.explanation
            ORDER BY occurrence DESC
        """, (user_id,))
        
        detail_records = cursor.fetchall()
        conn.close()
        
        # Process JLPT level data
        jlpt_performance = {}
        for record in jlpt_records:
            jlpt_level, questions, correct = record
            
            if questions > 0:
                accuracy = round(correct / questions * 100, 2)
                jlpt_performance[jlpt_level] = {
                    "questions": questions,
                    "accuracy": accuracy
                }
        
        # Determine strengths and weaknesses by JLPT level
        strengths = []
        weaknesses = []
        
        # Only consider levels with at least 5 questions
        valid_levels = {level: data for level, data in jlpt_performance.items() 
                       if data["questions"] >= 5}
        
        if valid_levels:
            # Find average accuracy across all valid levels
            avg_accuracy = sum(data["accuracy"] for data in valid_levels.values()) / len(valid_levels)
            
            for level, data in valid_levels.items():
                if data["accuracy"] >= avg_accuracy + 10:  # 10% above average
                    strengths.append({
                        "type": "jlpt_level",
                        "item": level,
                        "accuracy": data["accuracy"],
                        "questions": data["questions"]
                    })
                elif data["accuracy"] <= avg_accuracy - 10:  # 10% below average
                    weaknesses.append({
                        "type": "jlpt_level",
                        "item": level,
                        "accuracy": data["accuracy"],
                        "questions": data["questions"]
                    })
        
        # Process detailed grammar/vocabulary data
        grammar_patterns = {}
        vocabulary_items = {}
        
        for record in detail_records:
            explanation, occurrence, correct = record
            
            if not explanation:
                continue
                
            accuracy = round(correct / occurrence * 100, 2) if occurrence > 0 else 0
            
            # Simple heuristic: if it has particles or verb forms, it's grammar; otherwise vocabulary
            if any(pattern in explanation.lower() for pattern in ["particle", "form", "tense", "grammar", "structure"]):
                grammar_patterns[explanation] = {
                    "occurrence": occurrence,
                    "accuracy": accuracy
                }
            else:
                vocabulary_items[explanation] = {
                    "occurrence": occurrence,
                    "accuracy": accuracy
                }
        
        # Find grammar strengths and weaknesses
        for explanation, data in grammar_patterns.items():
            if data["occurrence"] >= 3:  # Only consider items that appear at least 3 times
                if data["accuracy"] >= 80:  # 80% or higher is a strength
                    strengths.append({
                        "type": "grammar",
                        "item": explanation,
                        "accuracy": data["accuracy"],
                        "occurrence": data["occurrence"]
                    })
                elif data["accuracy"] <= 50:  # 50% or lower is a weakness
                    weaknesses.append({
                        "type": "grammar",
                        "item": explanation,
                        "accuracy": data["accuracy"],
                        "occurrence": data["occurrence"]
                    })
        
        # Find vocabulary strengths and weaknesses
        for explanation, data in vocabulary_items.items():
            if data["occurrence"] >= 3:  # Only consider items that appear at least 3 times
                if data["accuracy"] >= 80:  # 80% or higher is a strength
                    strengths.append({
                        "type": "vocabulary",
                        "item": explanation,
                        "accuracy": data["accuracy"],
                        "occurrence": data["occurrence"]
                    })
                elif data["accuracy"] <= 50:  # 50% or lower is a weakness
                    weaknesses.append({
                        "type": "vocabulary",
                        "item": explanation,
                        "accuracy": data["accuracy"],
                        "occurrence": data["occurrence"]
                    })
        
        return {
            "jlpt_performance": jlpt_performance,
            "strengths": strengths[:5],  # Top 5 strengths
            "weaknesses": weaknesses[:5]  # Top 5 weaknesses
        }
    
    def generate_study_recommendations(self):
        """Generate recommendations for future study based on performance."""
        # Get strengths and weaknesses
        strengths_and_weaknesses = self.get_strengths_and_weaknesses()
        weaknesses = strengths_and_weaknesses["weaknesses"]
        
        # Get performance over time
        performance = self.get_performance_over_time(days=30)
        
        # Generate general recommendations based on performance trends
        general_recommendations = []
        
        if performance["trends"]["accuracy"] < 0:
            general_recommendations.append({
                "priority": "high",
                "category": "general",
                "recommendation": "Your accuracy has been declining. Consider reviewing previously studied material."
            })
        
        if not performance["dates"]:
            general_recommendations.append({
                "priority": "high",
                "category": "consistency",
                "recommendation": "You haven't studied recently. Try to establish a regular study routine."
            })
        elif len(performance["dates"]) < 5:  # Less than 5 study days in the last 30 days
            general_recommendations.append({
                "priority": "medium",
                "category": "consistency",
                "recommendation": "Your study pattern is infrequent. Aim for at least 3-4 sessions per week."
            })
        
        # Generate recommendations based on weaknesses
        specific_recommendations = []
        
        for weakness in weaknesses:
            if weakness["type"] == "jlpt_level":
                specific_recommendations.append({
                    "priority": "high",
                    "category": "level",
                    "recommendation": f"Focus more on {weakness['item']} level content. Your accuracy is {weakness['accuracy']}%."
                })
            elif weakness["type"] == "grammar":
                specific_recommendations.append({
                    "priority": "medium",
                    "category": "grammar",
                    "recommendation": f"Review grammar pattern: {weakness['item'].split(':')[0] if ':' in weakness['item'] else weakness['item']}"
                })
            elif weakness["type"] == "vocabulary":
                specific_recommendations.append({
                    "priority": "medium",
                    "category": "vocabulary",
                    "recommendation": f"Practice vocabulary: {weakness['item'].split(':')[0] if ':' in weakness['item'] else weakness['item']}"
                })
        
        # Combine and prioritize recommendations
        all_recommendations = general_recommendations + specific_recommendations
        
        # Limit to top 7 recommendations
        return all_recommendations[:7]
    
    def generate_performance_chart(self, days=30, jlpt_level=None):
        """Generate a performance chart and return the file path."""
        # Get performance data
        performance = self.get_performance_over_time(days, jlpt_level)
        
        if not performance["dates"]:
            return None  # No data to plot
        
        # Convert dates to datetime objects
        dates = [datetime.strptime(date, "%Y-%m-%d") for date in performance["dates"]]
        
        # Create the plot
        plt.figure(figsize=(10, 6))
        
        # Plot accuracy
        ax1 = plt.gca()
        ax1.set_xlabel('Date')
        ax1.set_ylabel('Accuracy (%)', color='tab:blue')
        ax1.plot(dates, performance["accuracy"], 'o-', color='tab:blue', label='Accuracy (%)')
        ax1.tick_params(axis='y', labelcolor='tab:blue')
        ax1.set_ylim(0, 100)
        
        # Plot question count on secondary y-axis
        ax2 = ax1.twinx()
        ax2.set_ylabel('Questions Attempted', color='tab:red')
        ax2.bar(dates, performance["question_counts"], color='tab:red', alpha=0.3, label='Questions')
        ax2.tick_params(axis='y', labelcolor='tab:red')
        
        # Format the plot
        plt.title(f'Japanese Learning Performance Over Time {f"(JLPT {jlpt_level})" if jlpt_level else ""}')
        plt.grid(True, alpha=0.3)
        
        # Add trend information
        if performance["trends"]["accuracy"] > 0:
            trend_text = f"Accuracy Trend: Improving (+{performance['trends']['accuracy']}% per day)"
        elif performance["trends"]["accuracy"] < 0:
            trend_text = f"Accuracy Trend: Declining ({performance['trends']['accuracy']}% per day)"
        else:
            trend_text = "Accuracy Trend: Stable"
            
        plt.figtext(0.5, 0.01, trend_text, ha='center', fontsize=10, bbox={"facecolor":"orange", "alpha":0.2, "pad":5})
        
        # Rotate date labels for better readability
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # Save to a temporary file
        temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        plt.savefig(temp_file.name)
        plt.close()
        
        return temp_file.name

    def get_learning_pace(self):
        """Calculate user's learning pace and estimate time to next JLPT level."""
        user_id = self.default_user_id
        conn = self.connect()
        cursor = conn.cursor()
        
        # Get latest JLPT level and performance
        cursor.execute("""
            SELECT jlpt_level, COUNT(*) as sessions,
                   AVG(questions_correct * 100.0 / questions_attempted) as avg_accuracy
            FROM user_progress
            WHERE user_id = ? AND jlpt_level IS NOT NULL
            GROUP BY jlpt_level
            ORDER BY last_access DESC
            LIMIT 1
        """, (user_id,))
        
        current_level_data = cursor.fetchone()
        if not current_level_data:
            return {
                "current_level": None,
                "estimated_next_level_date": None,
                "recommended_pace": None,
                "current_pace": None
            }
            
        current_level, sessions, accuracy = current_level_data
        
        # Calculate study frequency
        cursor.execute("""
            SELECT COUNT(DISTINCT date(last_access)) as study_days,
                   julianday(MAX(last_access)) - julianday(MIN(last_access)) as date_range
            FROM user_progress
            WHERE user_id = ? AND jlpt_level = ?
        """, (user_id, current_level))
        
        study_pattern = cursor.fetchone()
        study_days, date_range = study_pattern if study_pattern else (0, 0)
        
        # Calculate current pace
        current_pace = round(study_days / date_range * 7, 1) if date_range > 0 else 0  # sessions per week
        
        # JLPT level progression estimates (in months)
        level_progression = {
            "N5": {"next": "N4", "estimated_months": 3},
            "N4": {"next": "N3", "estimated_months": 6},
            "N3": {"next": "N2", "estimated_months": 9},
            "N2": {"next": "N1", "estimated_months": 12},
            "N1": {"next": None, "estimated_months": None}
        }
        
        # Get next level info
        next_level_info = level_progression.get(current_level, {"next": None, "estimated_months": None})
        next_level = next_level_info["next"]
        estimated_months = next_level_info["estimated_months"]
        
        # Calculate estimated completion date based on current pace and accuracy
        if estimated_months and accuracy:
            # Adjust estimated months based on accuracy
            if accuracy >= 80:
                estimated_months *= 0.8  # Faster if accuracy is high
            elif accuracy <= 60:
                estimated_months *= 1.2  # Slower if accuracy is low
                
            # Adjust based on study frequency
            if current_pace >= 3:  # Studying at least 3 times per week
                estimated_months *= 0.9
            elif current_pace <= 1:  # Studying less than once per week
                estimated_months *= 1.3
                
            estimated_completion_date = datetime.now() + timedelta(days=int(estimated_months * 30))
        else:
            estimated_completion_date = None
        
        conn.close()
        
        return {
            "current_level": current_level,
            "next_level": next_level,
            "current_accuracy": round(accuracy, 2) if accuracy else 0,
            "study_frequency": {
                "days_per_week": current_pace,
                "total_study_days": study_days,
                "consistency": "good" if current_pace >= 3 else "moderate" if current_pace >= 1 else "low"
            },
            "estimated_completion": {
                "estimated_months": round(estimated_months, 1) if estimated_months else None,
                "estimated_date": estimated_completion_date.strftime('%Y-%m-%d') if estimated_completion_date else None,
                "confidence": "high" if accuracy >= 80 and current_pace >= 3 else
                             "medium" if accuracy >= 60 and current_pace >= 1 else "low"
            },
            "recommendations": {
                "recommended_sessions_per_week": 3 if current_pace < 3 else current_pace,
                "recommended_daily_questions": 10 if current_pace < 3 else 15
            }
        }
    
    def get_detailed_analytics(self, days=90):
        """Get detailed analytics including patterns and predictions."""
        performance = self.get_performance_over_time(days)
        strengths_weaknesses = self.get_strengths_and_weaknesses()
        learning_pace = self.get_learning_pace()
        
        # Calculate best study times
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                strftime('%H', last_access) as hour,
                AVG(questions_correct * 100.0 / questions_attempted) as avg_accuracy,
                COUNT(*) as session_count
            FROM user_progress
            WHERE user_id = ?
            GROUP BY strftime('%H', last_access)
            HAVING session_count >= 3
            ORDER BY avg_accuracy DESC
        """, (self.default_user_id,))
        
        time_performance = cursor.fetchall()
        conn.close()
        
        # Process best study times
        best_study_times = []
        if time_performance:
            for hour, accuracy, count in time_performance[:3]:  # Top 3 times
                best_study_times.append({
                    "hour": int(hour),
                    "accuracy": round(accuracy, 2),
                    "session_count": count
                })
        
        # Calculate improvement rate
        if performance["accuracy"] and len(performance["accuracy"]) >= 2:
            first_week = np.mean(performance["accuracy"][:7]) if len(performance["accuracy"]) >= 7 else performance["accuracy"][0]
            last_week = np.mean(performance["accuracy"][-7:]) if len(performance["accuracy"]) >= 7 else performance["accuracy"][-1]
            improvement_rate = round(last_week - first_week, 2)
        else:
            improvement_rate = 0
        
        return {
            "overall_progress": {
                "improvement_rate": improvement_rate,
                "current_streak": self._calculate_current_streak(),
                "best_streak": self._calculate_best_streak(),
                "total_study_hours": self._calculate_total_study_time() / 3600  # Convert seconds to hours
            },
            "study_patterns": {
                "best_study_times": best_study_times,
                "recommended_session_length": self._calculate_optimal_session_length(),
                "optimal_difficulty": self._calculate_optimal_difficulty()
            },
            "performance_breakdown": strengths_weaknesses,
            "learning_pace": learning_pace,
            "predictions": {
                "next_milestone": self._predict_next_milestone(),
                "estimated_completion": learning_pace.get("estimated_completion")
            }
        }
    
    def _calculate_current_streak(self):
        """Calculate the current consecutive days study streak."""
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute("""
            WITH RECURSIVE dates AS (
                SELECT date(MAX(last_access)) as study_date
                FROM user_progress
                WHERE user_id = ?
                
                UNION ALL
                
                SELECT date(date(study_date, '-1 day'))
                FROM dates
                WHERE EXISTS (
                    SELECT 1 
                    FROM user_progress 
                    WHERE user_id = ? 
                    AND date(last_access) = date(date(study_date, '-1 day'))
                )
            )
            SELECT COUNT(*) FROM dates
        """, (self.default_user_id, self.default_user_id))
        
        streak = cursor.fetchone()[0]
        conn.close()
        
        return streak
    
    def _calculate_best_streak(self):
        """Calculate the best study streak ever achieved."""
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT study_date, 
                   CASE 
                       WHEN julianday(study_date) - julianday(LAG(study_date, 1) OVER (ORDER BY study_date)) = 1 
                       THEN 0 
                       ELSE 1 
                   END as new_streak
            FROM (
                SELECT DISTINCT date(last_access) as study_date
                FROM user_progress
                WHERE user_id = ?
                ORDER BY study_date
            )
        """, (self.default_user_id,))
        
        dates = cursor.fetchall()
        conn.close()
        
        if not dates:
            return 0
            
        # Calculate streaks
        current_streak = 1
        max_streak = 1
        
        for i in range(1, len(dates)):
            if (datetime.strptime(dates[i][0], '%Y-%m-%d') - 
                datetime.strptime(dates[i-1][0], '%Y-%m-%d')).days == 1:
                current_streak += 1
                max_streak = max(max_streak, current_streak)
            else:
                current_streak = 1
        
        return max_streak
    
    def _calculate_total_study_time(self):
        """Calculate total time spent studying in seconds."""
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT SUM(completion_time)
            FROM user_progress
            WHERE user_id = ? AND completion_time > 0
        """, (self.default_user_id,))
        
        total_time = cursor.fetchone()[0] or 0
        conn.close()
        
        return total_time
    
    def _calculate_optimal_session_length(self):
        """Calculate optimal study session length based on performance data."""
        conn = self.connect()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN completion_time <= 900 THEN '0-15min'
                    WHEN completion_time <= 1800 THEN '15-30min'
                    WHEN completion_time <= 2700 THEN '30-45min'
                    ELSE '45min+'
                END as session_length,
                AVG(questions_correct * 100.0 / questions_attempted) as avg_accuracy,
                COUNT(*) as session_count
            FROM user_progress
            WHERE user_id = ? AND completion_time > 0
            GROUP BY 
                CASE 
                    WHEN completion_time <= 900 THEN '0-15min'
                    WHEN completion_time <= 1800 THEN '15-30min'
                    WHEN completion_time <= 2700 THEN '30-45min'
                    ELSE '45min+'
                END
            HAVING session_count >= 3
            ORDER BY avg_accuracy DESC
            LIMIT 1
        """, (self.default_user_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return {
                "optimal_length": result[0],
                "average_accuracy": round(result[1], 2),
                "sample_size": result[2]
            }
        return {
            "optimal_length": "15-30min",  # Default recommendation
            "average_accuracy": None,
            "sample_size": 0
        }
    
    def _calculate_optimal_difficulty(self):
        """Calculate optimal difficulty level based on performance data."""
        strengths = self.get_strengths_and_weaknesses()
        performance = self.get_performance_over_time(days=30)
        
        # Get current JLPT level performance
        jlpt_performance = strengths.get("jlpt_performance", {})
        
        # Find the level with the best balance of challenge and achievement
        optimal_level = None
        optimal_score = -1
        
        for level, data in jlpt_performance.items():
            accuracy = data["accuracy"]
            questions = data["questions"]
            
            # Score based on the 80/20 principle - best learning happens at 80% accuracy
            challenge_score = 100 - abs(80 - accuracy)  # Higher score closer to 80% accuracy
            volume_score = min(questions / 10, 100)  # Scale based on number of questions attempted
            
            total_score = (challenge_score * 0.7) + (volume_score * 0.3)
            
            if total_score > optimal_score:
                optimal_score = total_score
                optimal_level = level
        
        return {
            "optimal_jlpt_level": optimal_level or "N5",
            "recommended_accuracy_target": "75-85%",
            "confidence_score": round(optimal_score, 2) if optimal_score > 0 else None
        }
    
    def _predict_next_milestone(self):
        """Predict the next achievement milestone based on current progress."""
        performance = self.get_performance_over_time(days=30)
        learning_pace = self.get_learning_pace()
        
        current_level = learning_pace.get("current_level")
        if not current_level:
            return {
                "type": "first_milestone",
                "description": "Complete your first study session",
                "estimated_date": "Start today!"
            }
        
        # Check various milestone types
        milestones = []
        
        # Study streak milestone
        current_streak = self._calculate_current_streak()
        next_streak_milestone = 5 if current_streak < 5 else 10 if current_streak < 10 else 30
        if current_streak < next_streak_milestone:
            milestones.append({
                "type": "streak",
                "description": f"Reach a {next_streak_milestone}-day study streak",
                "current": current_streak,
                "target": next_streak_milestone,
                "priority": 1
            })
        
        # Accuracy milestone
        current_accuracy = learning_pace.get("current_accuracy", 0)
        next_accuracy_milestone = 70 if current_accuracy < 70 else 80 if current_accuracy < 80 else 90
        if current_accuracy < next_accuracy_milestone:
            milestones.append({
                "type": "accuracy",
                "description": f"Achieve {next_accuracy_milestone}% accuracy in {current_level}",
                "current": current_accuracy,
                "target": next_accuracy_milestone,
                "priority": 2
            })
        
        # JLPT level milestone
        if learning_pace.get("next_level"):
            milestones.append({
                "type": "level",
                "description": f"Progress to {learning_pace['next_level']}",
                "estimated_date": learning_pace.get("estimated_completion", {}).get("estimated_date"),
                "priority": 3
            })
        
        # Sort by priority and return the most immediate milestone
        if milestones:
            return sorted(milestones, key=lambda x: x["priority"])[0]
        
        return {
            "type": "maintenance",
            "description": "Maintain your current excellent performance level",
            "current_level": current_level
        }

# Example usage
if __name__ == "__main__":
    tracker = PerformanceTracker()
    
    # Example: Get performance over time
    print("Performance over time:")
    performance = tracker.get_performance_over_time(days=30)
    print(json.dumps(performance, indent=2))
    
    # Example: Get detailed analytics
    print("\nDetailed Analytics:")
    analytics = tracker.get_detailed_analytics()
    print(json.dumps(analytics, indent=2))
    
    # Generate performance chart
    print("\nGenerating performance chart...")
    chart_path = tracker.generate_performance_chart()
    if chart_path:
        print(f"Chart saved to: {chart_path}")

# Assuming there is a form field in the code, add a valid autocomplete value
# Example:
# <input type="text" name="username" autocomplete="username">