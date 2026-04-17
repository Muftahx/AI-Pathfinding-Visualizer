"""
Pure AI pathfinding algorithms: BFS, DFS, Dijkstra, A*.
No web-framework dependencies. Returns exploration order + shortest path.
"""

from __future__ import annotations
from collections import deque
from typing import Dict, List, Optional, Set, Tuple
import heapq

Coord = Tuple[int, int]
GridSpec = Dict
AlgorithmResult = Dict

DIRECTIONS: List[Coord] = [(-1, 0), (1, 0), (0, -1), (0, 1)]


def _get_neighbours(row: int, col: int, rows: int, cols: int, walls: Set[Coord]) -> List[Coord]:
    """Return walkable cardinal neighbours of (row, col)."""
    result = []
    for dr, dc in DIRECTIONS:
        nr, nc = row + dr, col + dc
        if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in walls:
            result.append((nr, nc))
    return result


def _reconstruct_path(came_from: Dict[Coord, Optional[Coord]], end: Coord) -> List[List[int]]:
    """Trace came_from map backwards to build path from start to end."""
    path = []
    current = end
    while current is not None:
        path.append([current[0], current[1]])
        current = came_from.get(current)
    path.reverse()
    return path


def _build_result(explored, path, found, weights=None, cost=None) -> AlgorithmResult:
    """Standardised result dict for all algorithms."""
    # Compute total_cost from path + weights if not provided
    if cost is None and found and path:
        w = weights or {}
        cost = sum(float(w.get(tuple(node), 1)) for node in path[1:])
    result = {
        "explored": explored,
        "path": path,
        "found": found,
        "stats": {
            "explored_count": len(explored),
            "path_length": len(path),
        },
    }
    if cost is not None:
        result["stats"]["total_cost"] = cost
    return result


def _parse_grid(data: GridSpec):
    """Extract grid parameters from validated payload."""
    rows = data["rows"]
    cols = data["cols"]
    start = tuple(data["start"])
    end = tuple(data["end"])
    walls = {tuple(w) for w in data.get("walls", [])}
    weights = {tuple(w["pos"]): w["weight"] for w in data.get("weights", [])}
    return rows, cols, start, end, walls, weights


def bfs(data: GridSpec) -> AlgorithmResult:
    """BFS — FIFO queue, guarantees shortest path on unweighted grids."""
    rows, cols, start, end, walls, weights = _parse_grid(data)

    visited = {start}
    came_from = {start: None}
    queue = deque([start])
    explored = []

    while queue:
        current = queue.popleft()
        explored.append([current[0], current[1]])

        if current == end:
            return _build_result(explored, _reconstruct_path(came_from, end), True, weights=weights)

        for nb in _get_neighbours(current[0], current[1], rows, cols, walls):
            if nb not in visited:
                visited.add(nb)
                came_from[nb] = current
                queue.append(nb)

    return _build_result(explored, [], False)


def dfs(data: GridSpec) -> AlgorithmResult:
    """DFS — LIFO stack, does NOT guarantee shortest path."""
    rows, cols, start, end, walls, weights = _parse_grid(data)

    visited = set()
    came_from = {start: None}
    stack = [start]
    explored = []

    while stack:
        current = stack.pop()
        if current in visited:
            continue
        visited.add(current)
        explored.append([current[0], current[1]])

        if current == end:
            return _build_result(explored, _reconstruct_path(came_from, end), True, weights=weights)

        for nb in _get_neighbours(current[0], current[1], rows, cols, walls):
            if nb not in visited:
                came_from[nb] = current
                stack.append(nb)

    return _build_result(explored, [], False)


def dijkstra(data: GridSpec) -> AlgorithmResult:
    """Dijkstra — min-heap priority queue, handles weighted cells."""
    rows, cols, start, end, walls, weights = _parse_grid(data)

    dist = {start: 0.0}
    came_from = {start: None}
    visited = set()
    heap = [(0.0, start)]
    explored = []

    while heap:
        cost, current = heapq.heappop(heap)
        if current in visited:
            continue
        visited.add(current)
        explored.append([current[0], current[1]])

        if current == end:
            return _build_result(explored, _reconstruct_path(came_from, end), True, cost=cost)

        for nb in _get_neighbours(current[0], current[1], rows, cols, walls):
            edge_cost = float(weights.get(nb, 1))
            new_cost = cost + edge_cost
            if nb not in dist or new_cost < dist[nb]:
                dist[nb] = new_cost
                came_from[nb] = current
                heapq.heappush(heap, (new_cost, nb))

    return _build_result(explored, [], False)


def a_star(data: GridSpec) -> AlgorithmResult:
    """A* — Dijkstra + Manhattan distance heuristic for faster optimal paths."""
    rows, cols, start, end, walls, weights = _parse_grid(data)

    def h(a, b):
        return float(abs(a[0] - b[0]) + abs(a[1] - b[1]))

    g_score = {start: 0.0}
    came_from = {start: None}
    visited = set()
    heap = [(h(start, end), start)]
    explored = []

    while heap:
        _, current = heapq.heappop(heap)
        if current in visited:
            continue
        visited.add(current)
        explored.append([current[0], current[1]])

        if current == end:
            return _build_result(explored, _reconstruct_path(came_from, end), True, cost=g_score[end])

        for nb in _get_neighbours(current[0], current[1], rows, cols, walls):
            edge_cost = float(weights.get(nb, 1))
            tentative_g = g_score[current] + edge_cost
            if nb not in g_score or tentative_g < g_score[nb]:
                g_score[nb] = tentative_g
                came_from[nb] = current
                heapq.heappush(heap, (tentative_g + h(nb, end), nb))

    return _build_result(explored, [], False)


# Maps algorithm names to their functions
ALGORITHM_REGISTRY = {
    "bfs": bfs,
    "dfs": dfs,
    "dijkstra": dijkstra,
    "astar": a_star,
}
