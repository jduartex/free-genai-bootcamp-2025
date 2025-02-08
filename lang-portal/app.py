from flask import Flask, jsonify
from flask_cors import CORS
from database_best_practices import DatabaseBestPractices, setup_flask_db, create_user_blueprint

def create_app(test_config=None):
    """
    Create and configure the Flask application using best practices
    """
    app = Flask(__name__)
    
    # Configure app
    if test_config is None:
        app.config.from_mapping(
            DATABASE='words.db'
        )
    else:
        app.config.update(test_config)
    
    # Initialize database with best practices
    setup_flask_db(app, app.config['DATABASE'])
    
    # Configure CORS with combined origins
    allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"] if app.debug else []
    CORS(app, resources={
        r"/*": {
            "origins": allowed_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Register blueprints
    register_blueprints(app)

    return app

def register_blueprints(app):
    """
    Register all blueprints for the application
    Following best practice of organizing routes
    """
    # Register user routes
    users_bp = create_user_blueprint()
    app.register_blueprint(users_bp, url_prefix='/api')
    
    # Example of words blueprint
    from routes.words import create_words_blueprint
    words_bp = create_words_blueprint()
    app.register_blueprint(words_bp, url_prefix='/api')

# Example of a route blueprint using best practices
def create_words_blueprint():
    """
    Example of creating a blueprint for word-related routes
    using database best practices
    """
    from flask import Blueprint, request, current_app
    words_bp = Blueprint('words', __name__)
    
    @words_bp.route('/words', methods=['GET'])
    def get_words():
        try:
            # Get pagination parameters
            page = int(request.args.get('page', 1))
            
            # Get database connection using best practices
            db = current_app.get_db()
            cursor = db.cursor()
            
            # Use safe parameterized query
            cursor.execute("""
                SELECT w.id, w.kanji, w.romaji, w.english 
                FROM words w
                LIMIT ? OFFSET ?
            """, (50, (page - 1) * 50))
            
            words = cursor.fetchall()
            
            return jsonify({
                "success": True,
                "words": [dict(word) for word in words]
            }), 200
            
        except ValueError as e:
            return jsonify({
                "success": False,
                "error": "Invalid page number"
            }), 400
        except Exception as e:
            return jsonify({
                "success": False,
                "error": "Internal server error"
            }), 500
    
    @words_bp.route('/words', methods=['POST'])
    def create_word():
        try:
            # Validate request data
            data = request.get_json()
            required_fields = ['kanji', 'romaji', 'english']
            
            if not data or not all(field in data for field in required_fields):
                return jsonify({
                    "success": False,
                    "error": "Missing required fields",
                    "required": required_fields
                }), 400
            
            # Get database connection
            db = current_app.get_db()
            cursor = db.cursor()
            
            # Use safe parameterized query for insert
            cursor.execute("""
                INSERT INTO words (kanji, romaji, english)
                VALUES (?, ?, ?)
            """, (data['kanji'], data['romaji'], data['english']))
            
            db.commit()
            
            return jsonify({
                "success": True,
                "message": "Word created successfully",
                "id": cursor.lastrowid
            }), 201
            
        except Exception as e:
            db.rollback()
            return jsonify({
                "success": False,
                "error": "Failed to create word"
            }), 500
    
    return words_bp

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True) 