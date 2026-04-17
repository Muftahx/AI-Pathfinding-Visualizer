from __future__ import annotations
from typing import Any, Dict, List, Tuple
from flask import Blueprint, Response, jsonify, request
from backend.algorithms import ALGORITHM_REGISTRY

api_bp = Blueprint("api", __name__, url_prefix="/api/v1")


class ValidationError(Exception):
    """Raised when request payload fails validation."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _require_key(payload: Dict, key: str, expected_type: type) -> Any:
    """Ensure key exists in payload with correct type."""
    value = payload.get(key)
    if value is None:
        raise ValidationError(f"Missing required field: '{key}'")
    if not isinstance(value, expected_type):
        raise ValidationError(f"Field '{key}' must be {expected_type.__name__}, got {type(value).__name__}")
    return value


def _validate_coord(name: str, coord: List[int], rows: int, cols: int) -> Tuple[int, int]:
    """Validate a [row, col] pair is within grid bounds."""
    if not isinstance(coord, list) or len(coord) != 2:
        raise ValidationError(f"'{name}' must be a [row, col] array.")
    r, c = coord
    if not (isinstance(r, int) and isinstance(c, int)):
        raise ValidationError(f"'{name}' coordinates must be integers.")
    if not (0 <= r < rows and 0 <= c < cols):
        raise ValidationError(f"'{name}' ({r}, {c}) is out of bounds for a {rows}×{cols} grid.")
    return (r, c)


def _validate_payload(payload: Dict) -> Dict:
    """Validate the full solve request: types, bounds, and logical constraints."""
    algo = _require_key(payload, "algorithm", str)
    if algo.lower() not in ALGORITHM_REGISTRY:
        valid = ", ".join(sorted(ALGORITHM_REGISTRY.keys()))
        raise ValidationError(f"Unknown algorithm '{algo}'. Valid options: {valid}")
    payload["algorithm"] = algo.lower()

    rows = _require_key(payload, "rows", int)
    cols = _require_key(payload, "cols", int)
    if not (2 <= rows <= 100):
        raise ValidationError("'rows' must be between 2 and 100.")
    if not (2 <= cols <= 100):
        raise ValidationError("'cols' must be between 2 and 100.")

    start = _validate_coord("start", _require_key(payload, "start", list), rows, cols)
    end = _validate_coord("end", _require_key(payload, "end", list), rows, cols)
    if start == end:
        raise ValidationError("'start' and 'end' must be different cells.")

    walls = payload.get("walls", [])
    if not isinstance(walls, list):
        raise ValidationError("'walls' must be an array of [row, col] pairs.")
    wall_set = set()
    for i, w in enumerate(walls):
        coord = _validate_coord(f"walls[{i}]", w, rows, cols)
        wall_set.add(coord)
    if start in wall_set:
        raise ValidationError("'start' coordinate must not be a wall.")
    if end in wall_set:
        raise ValidationError("'end' coordinate must not be a wall.")

    weight_list = payload.get("weights", [])
    if not isinstance(weight_list, list):
        raise ValidationError("'weights' must be an array of {pos, weight} objects.")
    for i, entry in enumerate(weight_list):
        if not isinstance(entry, dict):
            raise ValidationError(f"'weights[{i}]' must be an object.")
        _validate_coord(f"weights[{i}].pos", entry.get("pos", []), rows, cols)
        w = entry.get("weight")
        if not isinstance(w, (int, float)) or w < 1:
            raise ValidationError(f"'weights[{i}].weight' must be a number ≥ 1.")

    return payload


@api_bp.errorhandler(ValidationError)
def handle_validation_error(error: ValidationError) -> Tuple[Response, int]:
    return jsonify({"error": error.message}), error.status_code


@api_bp.route("/solve", methods=["POST"])
def solve() -> Tuple[Response, int]:
    """Run a single algorithm on the grid and return results."""
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    try:
        validated = _validate_payload(body)
    except ValidationError as exc:
        return jsonify({"error": exc.message}), exc.status_code

    algo_name = validated["algorithm"]
    algo_fn = ALGORITHM_REGISTRY[algo_name]

    try:
        result = algo_fn(validated)
    except Exception as exc:
        return jsonify({"error": f"Internal algorithm error: {str(exc)}"}), 500

    result["algorithm"] = algo_name
    return jsonify(result), 200


@api_bp.route("/compare", methods=["POST"])
def compare() -> Tuple[Response, int]:
    """Run all algorithms on the same grid, return combined results."""
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    body["algorithm"] = "bfs"
    try:
        validated = _validate_payload(body)
    except ValidationError as exc:
        return jsonify({"error": exc.message}), exc.status_code

    results: Dict[str, Any] = {}
    for name, fn in ALGORITHM_REGISTRY.items():
        try:
            result = fn(validated)
            result["algorithm"] = name
            results[name] = result
        except Exception as exc:
            results[name] = {"error": str(exc), "algorithm": name}

    return jsonify(results), 200
