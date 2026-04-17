# 🧠 AI Search & Pathfinding Visualizer

An interactive web application that **visualizes how AI search algorithms explore and solve pathfinding problems** in real-time. Built as a practical demonstration of core artificial intelligence concepts covered in the course — Breadth-First Search, Depth-First Search, Dijkstra's Algorithm, and A* Search.

> **Course:** Principles of Artificial Intelligence  
> **Topic:** #2 — Search & Pathfinding Visualizer

![Main Interface](docs/screenshots/main-interface.png)

---

## ✨ Features

| Feature | Description |
|---|---|
| **4 Search Algorithms** | BFS, DFS, Dijkstra's, and A* — all implemented from scratch |
| **Real-Time Animation** | Watch algorithms explore the grid cell-by-cell with configurable speed |
| **Interactive Grid Editor** | Draw walls, place weighted cells, move start/end nodes with click & drag |
| **Maze Generators** | Auto-generate mazes: Random Walls, Recursive Division, Spiral, Staircase |
| **Algorithm Comparison** | Run all 4 algorithms simultaneously and compare results side-by-side |
| **Live Statistics** | Track explored nodes, path length, total cost, and execution time |

---

## 📸 Screenshots

### BFS Visualization on a Recursive Division Maze

The cyan cells show BFS exploring layer-by-layer outward from the start (green), while the golden path traces the shortest route to the end (pink).

![BFS Visualization](docs/screenshots/bfs-visualization.png)

### ⚡ Algorithm Comparison Mode

Run all 4 algorithms on the **identical grid** and see the differences at a glance. Notice how A* explores only **74 nodes** to find the same optimal path that BFS needed **324 nodes** for — the power of a good heuristic.

![Algorithm Comparison](docs/screenshots/algorithm-comparison.png)

---

## 🧮 Algorithm Explanations

### 1. Breadth-First Search (BFS)

**Data Structure:** FIFO Queue (`collections.deque`)  
**Guarantee:** Shortest path (on unweighted grids)  
**Strategy:** Explore all neighbours at the current depth before moving deeper.

```
BFS explores layer-by-layer like ripples in a pond:

    Layer 0:  S
    Layer 1:  ← ↑ → ↓  (all cells 1 step from Start)
    Layer 2:  all cells 2 steps from Start
    ...
```

BFS guarantees the shortest path because it exhaustively checks every node at distance *d* before any node at distance *d+1*. The trade-off is that it explores many unnecessary nodes in open grids.

### 2. Depth-First Search (DFS)

**Data Structure:** LIFO Stack (`list`)  
**Guarantee:** ❌ Does NOT guarantee shortest path  
**Strategy:** Dive as deep as possible before backtracking.

```
DFS dives deep like exploring a tunnel:

    S → right → right → right → ... → dead end
    ← backtrack → try another branch
    → down → down → ... → found E!
```

DFS uses less memory than BFS and can find *a* path quickly, but the path may be longer than optimal. It's useful when you only need to know *if* a path exists, not the shortest one.

### 3. Dijkstra's Algorithm

**Data Structure:** Min-Heap / Priority Queue (`heapq`)  
**Guarantee:** Shortest path (on weighted grids)  
**Strategy:** Always expand the lowest-cost frontier node first.

```
Dijkstra's prioritizes by accumulated cost:

    Priority Queue: [(cost=0, Start)]
    Pop lowest cost → explore neighbours → update costs
    Repeat until goal is reached
```

Dijkstra's generalizes BFS to handle **weighted edges** — cells can have different traversal costs. It always expands the cheapest node first, guaranteeing the minimum-cost path. On unweighted grids, it behaves identically to BFS.

### 4. A* Search (Bonus — Beyond Requirements)

**Data Structure:** Min-Heap / Priority Queue (`heapq`)  
**Guarantee:** Optimal path (with admissible heuristic)  
**Strategy:** Dijkstra + heuristic estimate of remaining distance.

```
A* uses: f(n) = g(n) + h(n)

    g(n) = actual cost from Start to n
    h(n) = estimated cost from n to End (Manhattan distance)
    f(n) = total estimated cost through n
```

A* dramatically reduces explored nodes by steering the search toward the goal. The **Manhattan distance heuristic** (`|row₁ - row₂| + |col₁ - col₂|`) is *admissible* on a 4-connected grid — it never overestimates the true distance, so the path is guaranteed optimal.

### Algorithm Comparison Table

| Algorithm | Shortest Path? | Weighted? | Time Complexity | Space Complexity |
|---|---|---|---|---|
| BFS | ✅ Yes | ❌ No | O(V + E) | O(V) |
| DFS | ❌ No | ❌ No | O(V + E) | O(V) |
| Dijkstra | ✅ Yes | ✅ Yes | O((V + E) log V) | O(V) |
| A* | ✅ Yes | ✅ Yes | O((V + E) log V) | O(V) |

*V = vertices (grid cells), E = edges (connections between adjacent cells)*

---

## 🏗️ Architecture

```
PAI Project/
├── run.py                     # Application entry point
├── requirements.txt           # Python dependencies
├── README.md                  # This file
│
├── backend/                   # Flask backend
│   ├── __init__.py            # Application factory (create_app)
│   ├── routes.py              # RESTful API endpoints (/solve, /compare)
│   └── algorithms.py          # Pure algorithm implementations (zero dependencies)
│
├── static/                    # Frontend (served by Flask)
│   ├── index.html             # Single page application
│   ├── css/
│   │   ├── variables.css      # Design tokens (colours, spacing, typography)
│   │   └── main.css           # Component styles & animations
│   └── js/
│       ├── main.js            # Application controller & state management
│       ├── api.js             # Backend communication layer
│       ├── grid.js            # Grid DOM construction & cell management
│       ├── animator.js        # Visualization animation engine
│       └── events.js          # Event listener management
│
└── docs/
    └── screenshots/           # Project screenshots
```

### Key Design Decisions

- **Pure Algorithm Functions:** All algorithms in `algorithms.py` are pure functions with zero web-framework dependencies. They accept a grid specification and return a standardized result dictionary — making them independently testable.
- **Flask Application Factory:** `create_app()` pattern enables clean configuration for development, testing, and production environments.
- **Modular ES6 Frontend:** Each concern (grid rendering, animation, API calls, event handling) lives in its own JavaScript module.
- **Validated API:** Every incoming request passes through comprehensive validation before reaching the algorithm layer, with structured error responses.

---

## 🚀 Setup & Installation

### Prerequisites

- **Python 3.10+** installed on your system
- **pip** (Python package manager)

### Steps

```bash
# 1. Clone or navigate to the project directory
cd "PAI Project"

# 2. Create a virtual environment
python -m venv .venv

# 3. Activate the virtual environment
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On Windows (Git Bash):
source .venv/Scripts/activate
# On macOS/Linux:
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run the application
python run.py
```

The server will start at **http://127.0.0.1:5000** — open this URL in your browser.

### Dependencies

| Package | Version | Purpose |
|---|---|---|
| Flask | 3.1.1 | Web framework & static file serving |
| Flask-CORS | 5.0.1 | Cross-Origin Resource Sharing support |

---

## 🎮 How to Use

### Basic Workflow

1. **Select an Algorithm** — Click one of the 4 algorithm buttons (BFS, DFS, Dijkstra, A*)
2. **Draw Obstacles** — Select the "Wall" tool and click/drag on the grid to create barriers
3. **Add Weights** — Select the "Weight" tool to place cells with higher traversal cost (cost = 5)
4. **Move Start/End** — Select "Start" or "End" tool, then click a cell to reposition
5. **Click ▶ Visualize** — Watch the algorithm explore the grid and find the path in real-time
6. **Click ⚡ Compare All** — Run all 4 algorithms simultaneously and compare their performance

### Maze Generators

Select a pattern from the **Maze Patterns** dropdown to auto-generate interesting grid layouts:

- **Random Walls (30%)** — Randomly fill ~30% of cells with walls
- **Recursive Division** — Classic maze generation via recursive wall division
- **Spiral** — Inward-spiraling wall pattern
- **Staircase** — Zigzag walls that force the path to navigate between levels

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `Enter` | Run the selected algorithm |
| `Escape` | Cancel running animation / close comparison modal |

---

## 📡 API Reference

### `POST /api/v1/solve`

Run a single algorithm on the grid.

**Request Body:**
```json
{
    "algorithm": "bfs",
    "rows": 20,
    "cols": 35,
    "start": [10, 8],
    "end": [10, 26],
    "walls": [[0, 5], [1, 5]],
    "weights": [{"pos": [3, 4], "weight": 5}]
}
```

**Response:**
```json
{
    "algorithm": "bfs",
    "found": true,
    "explored": [[10, 8], [9, 8], ...],
    "path": [[10, 8], [10, 9], ...],
    "stats": {
        "explored_count": 324,
        "path_length": 29
    }
}
```

### `POST /api/v1/compare`

Run all 4 algorithms on the same grid and return combined results.

**Response:**
```json
{
    "bfs":      { "found": true, "explored": [...], "path": [...], "stats": {...} },
    "dfs":      { "found": true, "explored": [...], "path": [...], "stats": {...} },
    "dijkstra": { "found": true, "explored": [...], "path": [...], "stats": {...} },
    "astar":    { "found": true, "explored": [...], "path": [...], "stats": {...} }
}
```

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Backend** | Python 3 + Flask | Recommended by the course; rich ecosystem for AI |
| **Algorithms** | Pure Python | No external dependencies — all algorithms coded from scratch |
| **Frontend** | Vanilla HTML/CSS/JS (ES6 Modules) | No build step required; clean, modern architecture |
| **Styling** | Custom CSS Design System | Dark theme with glassmorphism, CSS custom properties, responsive layout |

---

## 📜 License

This project was developed for the **Principles of Artificial Intelligence** course as an applied programming assignment.
