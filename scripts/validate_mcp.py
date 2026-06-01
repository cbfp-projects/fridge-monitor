#!/usr/bin/env python3
"""Validate .mcp.json and perform an MCP handshake against recipe-mcp."""

from __future__ import annotations

import json
import os
import re
import select
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
MCP_CONFIG = REPO_ROOT / ".mcp.json"
READ_TIMEOUT_SECONDS = 240

class LineReader:
    def __init__(self, file_obj):
        self.fd = file_obj.fileno()
        self.buffer = b""

    def read_line(self, timeout_seconds: int = READ_TIMEOUT_SECONDS) -> str:
        while b"\n" not in self.buffer:
            ready, _, _ = select.select([self.fd], [], [], timeout_seconds)
            if not ready:
                raise RuntimeError("Timed out waiting for MCP server response")
            chunk = os.read(self.fd, 4096)
            if not chunk:
                raise RuntimeError("Unexpected EOF from MCP server")
            self.buffer += chunk

        line, self.buffer = self.buffer.split(b"\n", 1)
        return line.decode("utf-8")


def send_message(stdin, message: dict) -> None:
    body = json.dumps(message, separators=(",", ":")) + "\n"
    stdin.write(body.encode("utf-8"))
    stdin.flush()


def wait_for_response(reader: LineReader, request_id: int) -> dict:
    while True:
        message = json.loads(reader.read_line())
        if message.get("id") == request_id:
            return message


def validate_config() -> None:
    config = json.loads(MCP_CONFIG.read_text(encoding="utf-8"))
    server = config["mcpServers"]["recipe-mcp"]
    command = server["command"]
    args = server["args"]
    if not isinstance(command, str) or not command:
        raise RuntimeError("recipe-mcp command must be a non-empty string")
    if not isinstance(args, list) or not args:
        raise RuntimeError("recipe-mcp args must be a non-empty list")
    if command != "uvx":
        raise RuntimeError("recipe-mcp command must be uvx")
    if "scripts/run_recipe_mcp.py" not in args:
        raise RuntimeError("recipe-mcp args must include scripts/run_recipe_mcp.py")
    if "--from" not in args or not any(str(arg).startswith("mcp[cli]") for arg in args):
        raise RuntimeError("recipe-mcp args must include an mcp[cli] dependency")
    if "--with" not in args or not any(str(arg).startswith("httpx") for arg in args):
        raise RuntimeError("recipe-mcp args must include an httpx dependency")
    if not any(str(arg).startswith("aiofiles") for arg in args):
        raise RuntimeError("recipe-mcp args must include an aiofiles dependency")

    runner = (REPO_ROOT / "scripts" / "run_recipe_mcp.py").read_text(encoding="utf-8")
    if not re.search(r'RECIPE_REF = "[0-9a-f]{40}"', runner):
        raise RuntimeError("run_recipe_mcp.py must pin recipe-mcp to a commit SHA")


def main() -> int:
    validate_config()
    process = subprocess.Popen(
        [sys.executable, "scripts/run_recipe_mcp.py"],
        cwd=REPO_ROOT,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    try:
        if process.stdin is None or process.stdout is None:
            raise RuntimeError("Failed to open MCP process stdio pipes")
        reader = LineReader(process.stdout)

        send_message(
            process.stdin,
            {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {},
                    "clientInfo": {"name": "fridge-monitor-validation", "version": "1.0"},
                },
            },
        )
        init_response = wait_for_response(reader, 1)
        if "result" not in init_response:
            raise RuntimeError("MCP initialize request failed")

        send_message(
            process.stdin,
            {"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}},
        )
        send_message(
            process.stdin,
            {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}},
        )
        tools_response = wait_for_response(reader, 2)
        tools = tools_response.get("result", {}).get("tools", [])
        if not tools:
            raise RuntimeError("recipe-mcp returned no tools")

        send_message(
            process.stdin,
            {"jsonrpc": "2.0", "id": 3, "method": "resources/list", "params": {}},
        )
        resources_response = wait_for_response(reader, 3)
        resources = resources_response.get("result", {}).get("resources", [])

        print("MCP validation passed")
        print(f"Tools discovered: {len(tools)}")
        print(f"Resources discovered: {len(resources)}")
        print(f"Tool names: {[tool.get('name') for tool in tools]}")
        return 0
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"MCP validation failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
