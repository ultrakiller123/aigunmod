"""Loopback-only GMod -> Minecraft relay. Python 3.10+, no third-party packages."""
from __future__ import annotations

import argparse
import json
import math
import re
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

MAX_BODY = 8 * 1024 * 1024
MAX_ENTITIES = 256
MAX_MODEL_FLOATS = 270_000
MAX_TOTAL_FLOATS = 2_700_000


def number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def vector(value, size=3):
    return isinstance(value, list) and len(value) == size and all(number(v) for v in value)


def require(condition, message):
    if not condition:
        raise ValueError(message)


class State:
    def __init__(self):
        self.lock = threading.Lock()
        self.session = None
        self.snapshot = None
        self.models = {}
        self.updated = 0.0
        self.input = None
        self.input_updated = 0.0

    def hello(self, body):
        session = body.get("session")
        require(isinstance(session, str) and 1 <= len(session) <= 128, "invalid session")
        with self.lock:
            reset = session != self.session
            if reset:
                self.session = session
                self.snapshot = None
                self.models.clear()
                self.input = None
                self.updated = 0.0
        return {"ok": True, "protocol": 1, "reset": reset}

    def publish(self, body):
        require(body.get("protocol") == 1, "unsupported protocol")
        seq = body.get("seq")
        require(isinstance(seq, int) and not isinstance(seq, bool) and seq >= 0, "invalid sequence")
        entities = body.get("entities")
        require(isinstance(entities, list) and len(entities) <= MAX_ENTITIES, "too many entities")
        ids = set()
        for entity in entities:
            require(isinstance(entity, dict), "invalid entity")
            eid = entity.get("id")
            require(isinstance(eid, int) and eid >= 0 and eid not in ids, "invalid/duplicate entity id")
            ids.add(eid)
            for key in ("pos", "ang", "mins", "maxs"):
                require(vector(entity.get(key)), "invalid " + key)
            require(vector(entity.get("color"), 4), "invalid color")
            require(all(0 <= c <= 255 for c in entity["color"]), "color outside range")
            require(isinstance(entity.get("model_key"), str), "invalid model key")
        require(vector(body.get("eye")), "invalid eye position")
        require(vector(body.get("eye_ang")), "invalid eye angle")
        shots = body.get("shots", [])
        require(isinstance(shots, list) and len(shots) <= 128, "too many shots")
        for shot in shots:
            require(isinstance(shot, dict) and vector(shot.get("start")) and vector(shot.get("end")), "invalid shot")
        with self.lock:
            require(body.get("session") == self.session, "session not initialized")
            if self.snapshot is not None:
                require(seq > self.snapshot["seq"], "out-of-order snapshot")
            self.snapshot = body
            self.updated = time.monotonic()
        return {"ok": True}

    def model(self, body):
        key = body.get("key")
        vertices = body.get("vertices")
        require(isinstance(key, str) and re.fullmatch(r"[a-zA-Z0-9_-]{1,64}", key), "invalid model key")
        require(isinstance(vertices, list) and 0 < len(vertices) <= MAX_MODEL_FLOATS and len(vertices) % 9 == 0,
                "invalid triangle mesh")
        require(all(number(v) and abs(v) <= 1_000_000 for v in vertices), "invalid mesh coordinate")
        with self.lock:
            require(body.get("session") == self.session, "session not initialized")
            require(key in self.models or len(self.models) < 128, "model cache full")
            total = sum(len(model["vertices"]) for k, model in self.models.items() if k != key)
            require(total + len(vertices) <= MAX_TOTAL_FLOATS, "total geometry budget exceeded")
            self.models[key] = {"key": key, "vertices": vertices}
        return {"ok": True}

    def read(self):
        with self.lock:
            return {"protocol": 1, "session": self.session,
                    "active": self.snapshot is not None and time.monotonic() - self.updated < 2,
                    "snapshot": self.snapshot, "models": list(self.models)}

    def set_input(self, body):
        require(vector(body.get("angles"), 2), "invalid view angles")
        require(all(abs(v) <= 360 for v in body["angles"]), "view angles outside range")
        for key in ("forward", "side"):
            require(number(body.get(key)) and abs(body[key]) <= 400, "invalid movement")
        for key in ("attack", "attack2", "jump", "use", "reload"):
            require(isinstance(body.get(key), bool), "invalid button")
        with self.lock:
            require(body.get("session") == self.session and self.session is not None, "wrong session")
            self.input = body
            self.input_updated = time.monotonic()
        return {"ok": True}

    def read_input(self, session):
        with self.lock:
            require(session == self.session, "wrong session")
            return {"input": self.input if time.monotonic() - self.input_updated < 0.35 else None}


def handler_for(state):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt, *args):
            # Avoid a log line for every 20 Hz update.
            if args and isinstance(args[0], str) and ' 400 ' in args[0]:
                super().log_message(fmt, *args)

        def reply(self, status, data):
            payload = json.dumps(data, allow_nan=False, separators=(",", ":")).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(payload)

        def do_GET(self):
            url = urlparse(self.path)
            query = parse_qs(url.query)
            try:
                if url.path == "/health":
                    self.reply(200, {"ok": True, "protocol": 1})
                elif url.path == "/state":
                    self.reply(200, state.read())
                elif url.path == "/input":
                    self.reply(200, state.read_input(query.get("session", [None])[0]))
                elif url.path == "/model":
                    with state.lock:
                        require(query.get("session", [None])[0] == state.session, "wrong session")
                        result = state.models.get(query.get("key", [None])[0])
                    self.reply(200 if result else 404, result or {"error": "model not found"})
                else:
                    self.reply(404, {"error": "not found"})
            except ValueError as exc:
                self.reply(400, {"error": str(exc)})

        def do_POST(self):
            try:
                length = int(self.headers.get("Content-Length", "0"))
                require(0 < length <= MAX_BODY, "invalid body size")
                require(self.headers.get("Content-Type", "").split(";")[0] == "application/json", "JSON required")
                self.connection.settimeout(5)
                body = json.loads(self.rfile.read(length))
                require(isinstance(body, dict), "object required")
                routes = {"/hello": state.hello, "/snapshot": state.publish,
                          "/model": state.model, "/input": state.set_input}
                route = routes.get(self.path)
                if route is None:
                    self.reply(404, {"error": "not found"})
                else:
                    self.reply(200, route(body))
            except (ValueError, TypeError, TimeoutError) as exc:
                self.reply(400, {"error": str(exc)})
    return Handler


def make_server(port=8765):
    state = State()
    server = ThreadingHTTPServer(("127.0.0.1", port), handler_for(state))
    server.bridge_state = state
    server.daemon_threads = True
    return server


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    with make_server(args.port) as server:
        print(f"GMod bridge listening on http://127.0.0.1:{server.server_port} (protocol 1)", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
