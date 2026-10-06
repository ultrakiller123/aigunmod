# Loopback protocol, revision 1

All requests use `http://127.0.0.1:8765`. POST bodies are JSON objects with
`Content-Type: application/json`. Success is HTTP 200; invalid input is HTTP 400.
The relay accepts no more than 8 MiB per POST. There is one active GMod exporter and
one intended Minecraft viewer/control client. Do not expose this relay externally.

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Returns `ok` and protocol revision |
| `POST /hello` | Initializes `session`; new sessions clear state, controls, and assets. Returns `reset` so exporters can refill an empty relay after restart |
| `POST /snapshot` | Publishes strictly increasing `seq` for the current session |
| `GET /state` | Returns `active`, `session`, `snapshot`, and available model keys. A source becomes inactive after two seconds without a snapshot |
| `POST /model` | Uploads a static triangle mesh with `session`, `key`, `vertices` |
| `GET /model?session=…&key=…` | Retrieves that mesh; rejects another session |
| `POST /input` | Updates the current session's latest input sample |
| `GET /input?session=…` | GMod polls the input sample; returns null after 350 ms |

Snapshot fields: `protocol: 1`, `session`, integer `seq`, arrays `entities` and
`shots`, three-component `eye` and `eye_ang`; optional `health` and `map`.
Each entity has integer `id`, `model_key`, `pos`, `ang`, `mins`, `maxs`, RGBA `color`,
and optional boolean `map`. The snapshot is a complete replacement; disappeared
entities stop rendering. Each shot has `start` and `end` position vectors.

Coordinates use Source units and axes. Positions are relative to the exporting
player's feet at stream start. Angles are `[pitch, yaw, roll]` in degrees. Mesh
vertices are local model coordinates, arranged as nine floats per triangle. World
map chunks have zero transform and vertices relative to the stream origin.
Minecraft maps `(x,y,z)` to `(x,z,-y)/40`, then adds its local scene anchor.

Inputs contain `session`, `[pitch,yaw]` in `angles`, `forward` and `side` speeds in
[-400,400], and booleans `attack`, `attack2`, `jump`, `use`, `reload`. No arbitrary
console command or Lua execution is supported. Minecraft stops repeating an input
sample after 200 ms without a new game tick. The relay and GMod server independently
expire stale controls. The GMod server additionally requires its opt-in convar.
