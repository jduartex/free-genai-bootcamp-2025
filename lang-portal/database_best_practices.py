import sqlite3
from typing import Any
from flask import g, jsonify, request
from contextlib import contextmanager

class DatabaseBestPractices:
    """
    Example class demonstrating SQLite3 best practices.
    
    Key Rules:
    1. Always close connections (use context managers)
    2. Use parameterized queries to prevent SQL injection
    3. Always commit transactions for write operations
    """
    
    def __init__(self, database_path: str):
        self.database_path = database_path
    
    @contextmanager
    def get_connection(self):
        """
        Rule 1: Always close connections using context manager
        Usage:
            with db.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM users")
        """
        conn = sqlite3.connect(self.database_path)
        try:
            yield conn
        finally:
            conn.close()
    
    def safe_query(self, user_input: str) -> list[Any]:
        """
        Rule 2: Use parameterized queries to prevent SQL injection
        
        BAD:  cursor.execute(f"SELECT * FROM users WHERE name = '{user_input}'")
        GOOD: Use ? or :name parameters
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # Using ? placeholder
            cursor.execute("SELECT * FROM users WHERE name = ?", (user_input,))
            
            # Alternative using named parameters
            # cursor.execute("SELECT * FROM users WHERE name = :name", {"name": user_input})
            
            return cursor.fetchall()
    
    def safe_update(self, user_id: int, new_status: bool) -> None:
        """
        Rule 3: Always commit transactions for write operations
        and use proper error handling
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute(
                    "UPDATE users SET active = ? WHERE id = ?", 
                    (new_status, user_id)
                )
                conn.commit()  # Commit changes
            except Exception as e:
                conn.rollback()  # Rollback on error
                raise e

# Flask-specific implementation
def setup_flask_db(app, database_path: str):
    """
    Bonus: Flask-specific database handling
    Sets up per-request database connections
    """
    
    def get_db():
        if 'db' not in g:
            g.db = sqlite3.connect(database_path)
            g.db.row_factory = sqlite3.Row  # Allows accessing columns by name
        return g.db
    
    @app.teardown_appcontext
    def close_db(error):
        """Closes the database connection at the end of request"""
        db = g.pop('db', None)
        if db is not None:
            db.close()
    
    # Add get_db to app context
    app.get_db = get_db

class FlaskBestPractices:
    """
    Key Rules for Flask Development:
    1. Always use error handling and return proper status codes
    2. Validate all request data before processing
    3. Use blueprints to organize routes by feature
    """
    
    @staticmethod
    def handle_request_example():
        """
        Rule 1: Proper error handling and status codes
        - Always return appropriate HTTP status codes
        - Wrap operations in try-except blocks
        - Return consistent JSON response format
        """
        try:
            # Attempt operation
            result = process_something()
            return jsonify({"data": result, "success": True}), 200
        except ValueError as e:
            # Client error (e.g. invalid input)
            return jsonify({"error": str(e), "success": False}), 400
        except Exception as e:
            # Server error (unexpected issues)
            return jsonify({"error": "Internal server error", "success": False}), 500
    
    @staticmethod
    def validate_request_example():
        """
        Rule 2: Always validate request data
        - Check if required fields exist
        - Validate data types and formats
        - Sanitize inputs before processing
        """
        data = request.get_json()
        
        # Check required fields
        required_fields = ['username', 'email']
        if not all(field in data for field in required_fields):
            return jsonify({
                "error": "Missing required fields",
                "required": required_fields,
                "success": False
            }), 400
            
        # Validate data format
        if not isinstance(data['username'], str) or len(data['username']) < 3:
            return jsonify({
                "error": "Username must be a string with at least 3 characters",
                "success": False
            }), 400
            
        # Process valid data
        return jsonify({"message": "Data valid", "success": True}), 200

# Example of Rule 3: Using blueprints to organize routes
from flask import Blueprint

def create_user_blueprint():
    """
    Rule 3: Organize routes using blueprints
    - Group related routes together
    - Keep code modular and maintainable
    - Makes testing easier
    """
    users_bp = Blueprint('users', __name__)
    
    @users_bp.route('/users', methods=['GET'])
    def get_users():
        try:
            return jsonify({"users": ["user1", "user2"], "success": True}), 200
        except Exception as e:
            return jsonify({"error": str(e), "success": False}), 500
    
    @users_bp.route('/users', methods=['POST'])
    def create_user():
        try:
            # Validate request data
            data = request.get_json()
            if not data or 'username' not in data:
                return jsonify({
                    "error": "Username required",
                    "success": False
                }), 400
                
            # Process valid request
            return jsonify({
                "message": f"User {data['username']} created",
                "success": True
            }), 201
            
        except Exception as e:
            return jsonify({"error": str(e), "success": False}), 500
    
    return users_bp

# Updated Flask usage example
if __name__ == "__main__":
    # Create instance
    db = DatabaseBestPractices("example.db")
    
    # Example of safe query
    users = db.safe_query("john")
    
    # Example of safe update
    try:
        db.safe_update(user_id=1, new_status=True)
    except Exception as e:
        print(f"Error updating user: {e}")
    
    # Example with Flask
    from flask import Flask
    app = Flask(__name__)
    setup_flask_db(app, "example.db")
    
    # Register blueprint
    users_blueprint = create_user_blueprint()
    app.register_blueprint(users_blueprint)
    
    # Example route using best practices
    @app.route('/api/data', methods=['POST'])
    def handle_data():
        return FlaskBestPractices.validate_request_example() 