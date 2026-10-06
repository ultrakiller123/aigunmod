import json
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from relay.bridge import make_server


class RelayTests(unittest.TestCase):
    def setUp(self):
        self.server = make_server(0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def request(self, path, body=None):
        request = Request(self.base + path, data=None if body is None else json.dumps(body).encode(),
                          headers={"Content-Type": "application/json"})
        try:
            with urlopen(request, timeout=3) as response:
                return response.status, json.load(response)
        except HTTPError as response:
            return response.code, json.load(response)

    def snapshot(self, seq=1, session="game1"):
        return {"protocol": 1, "session": session, "seq": seq,
                "eye": [0, 0, 64], "eye_ang": [0, 90, 0],
                "entities": [{"id": 7, "pos": [32, 0, 0], "ang": [0, 90, 0],
                              "mins": [-8, -8, -8], "maxs": [8, 8, 8],
                              "model_key": "crate", "color": [255, 255, 255, 255]}],
                "shots": [{"start": [0, 0, 64], "end": [100, 0, 64]}]}

    def test_publish_model_and_receive_complete_state(self):
        self.assertEqual(self.request("/health")[0], 200)
        self.assertFalse(self.request("/state")[1]["active"])
        self.request("/hello", {"session": "game1"})
        mesh = {"session": "game1", "key": "crate", "vertices": [0, 0, 0, 1, 0, 0, 0, 1, 0]}
        self.assertEqual(self.request("/model", mesh)[0], 200)
        snapshot = self.snapshot()
        self.assertEqual(self.request("/snapshot", snapshot)[0], 200)
        state = self.request("/state")[1]
        self.assertTrue(state["active"])
        self.assertEqual(state["snapshot"], snapshot)
        self.assertEqual(state["models"], ["crate"])
        self.assertEqual(self.request("/model?session=game1&key=crate")[1]["vertices"], mesh["vertices"])

    def test_bad_data_and_out_of_order_packets_are_rejected(self):
        self.request("/hello", {"session": "game1"})
        self.assertEqual(self.request("/snapshot", self.snapshot(2))[0], 200)
        self.assertEqual(self.request("/snapshot", self.snapshot(1))[0], 400)
        bad = self.snapshot(3)
        bad["entities"][0]["pos"][0] = float("nan")
        self.assertEqual(self.request("/snapshot", bad)[0], 400)
        self.assertEqual(self.request("/state")[1]["snapshot"]["seq"], 2)
        self.assertEqual(self.request("/snapshot", self.snapshot(4, "other"))[0], 400)

    def test_session_change_clears_old_models_and_stale_state(self):
        self.request("/hello", {"session": "game1"})
        self.request("/snapshot", self.snapshot())
        self.request("/model", {"session": "game1", "key": "crate", "vertices": [0] * 9})
        self.request("/hello", {"session": "game2"})
        state = self.request("/state")[1]
        self.assertFalse(state["active"])
        self.assertIsNone(state["snapshot"])
        self.assertEqual(state["models"], [])

    def test_control_input_expires_and_wrong_session_is_rejected(self):
        self.request("/hello", {"session": "game1"})
        inputs = {"session": "game1", "angles": [10, 30], "forward": 400, "side": 0,
                  "attack": True, "attack2": False, "jump": False, "use": False, "reload": False}
        self.assertEqual(self.request("/input", inputs)[0], 200)
        self.assertEqual(self.request("/input?session=game1")[1]["input"], inputs)
        self.assertEqual(self.request("/input?session=other")[0], 400)
        # Exercise real expiration without a timing-sensitive sleep.
        self.server.bridge_state.input_updated -= 1
        self.assertIsNone(self.request("/input?session=game1")[1]["input"])


if __name__ == "__main__":
    unittest.main()
