import os
from backend import create_app

app = create_app()

if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    print("\n AI Pathfinding Visualizer → http://127.0.0.1:5000\n")
    app.run(debug=debug, host="127.0.0.1", port=5000)
