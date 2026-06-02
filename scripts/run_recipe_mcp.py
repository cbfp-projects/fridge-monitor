#!/usr/bin/env python3
"""Run the pinned recipe-mcp server source over stdio for MCP clients."""

from __future__ import annotations

import importlib.util
import sys
import tempfile
import urllib.request
from pathlib import Path

RECIPE_REF = "e4d946b3268b68940f5f0f76fceddb3a5852f069"
RECIPE_SERVER_URL = (
    "https://raw.githubusercontent.com/suraj-yadav-aiml/recipe-mcp/"
    f"{RECIPE_REF}/recipe_server.py"
)


def load_recipe_module(script_path: Path):
    spec = importlib.util.spec_from_file_location("recipe_server", script_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load recipe server from {script_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="recipe-mcp-") as temp_dir:
        script_path = Path(temp_dir) / "recipe_server.py"
        with urllib.request.urlopen(RECIPE_SERVER_URL, timeout=30) as response:
            script_path.write_bytes(response.read())

        module = load_recipe_module(script_path)
        if not hasattr(module, "mcp"):
            raise RuntimeError("Pinned recipe server does not expose an MCP instance")
        module.mcp.run(transport="stdio")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Failed to start recipe-mcp: {exc}", file=sys.stderr)
        raise SystemExit(1)
