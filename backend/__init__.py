import os
from flask import Flask
from flask_cors import CORS


def create_app() -> Flask:
    """Create the Flask app with CORS, blueprints, and static file serving."""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_dir = os.path.join(project_root, "static")

    app = Flask(__name__, static_folder=static_dir, static_url_path="/static")
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from backend.routes import api_bp
    app.register_blueprint(api_bp)

    @app.route("/")
    def index():
        return app.send_static_file("index.html")

    return app
