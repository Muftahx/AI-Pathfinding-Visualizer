# 🧠 AI Search & Pathfinding Visualizer

Interactive web app that visualizes **BFS, DFS, Dijkstra, and A*** exploring a grid and finding paths in real-time.

## Features

- **4 Algorithms** — BFS, DFS, Dijkstra, A* (all coded from scratch)
- **Interactive Grid** — Draw walls, place weighted cells, drag start/end nodes
- **Maze Generators** — Random Walls, Recursive Division, Spiral, Staircase
- **Compare Mode** — Run all 4 algorithms side-by-side on the same grid
- **Live Stats** — Explored nodes, path length, total cost

## Quick Start

```bash
# Create & activate virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # macOS/Linux

# Install & run
pip install -r requirements.txt
python run.py
```

Open **http://127.0.0.1:5000** in your browser.

## Project Structure

```
├── run.py                  # Entry point
├── backend/
│   ├── __init__.py         # Flask app factory
│   ├── algorithms.py       # BFS, DFS, Dijkstra, A* (pure Python)
│   └── routes.py           # REST API + validation
└── static/
    ├── index.html
    ├── css/                # Design system
    └── js/                 # ES6 modules (controller, grid, animator, api, events)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python + Flask |
| Algorithms | Pure Python (no external libs) |
| Frontend | Vanilla HTML/CSS/JS (ES6 Modules) |

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/solve` | Run one algorithm |
| POST | `/api/v1/compare` | Run all 4 and compare |
