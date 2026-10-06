# Garry's Mod → Minecraft live bridge

This is an initial implementation for **Minecraft Java 1.21.1 + Fabric**, with both
games and the relay running on the **same Windows PC**. Garry's Mod remains the
simulation engine. Minecraft receives geometry, positions, rotations, camera state,
health, and visual bullet traces. Optional input travels back to the GMod player.

This is **not yet a complete transfer of GMod gameplay**. Compilation and networking
tests are automated; live rendering and Source-side behavior need validation on a PC
with both games. No Garry's Mod installation or graphical game session was available
in the build environment.

## What this version implements

| Feature | Implementation and limits |
| --- | --- |
| Prop and weapon geometry | Reads installed `.mdl` triangle geometry in GMod and streams static bind-pose meshes; solid entity colors, no Source textures/materials |
| Physics | Receives authoritative entity position and rotation at up to 20 Hz; the physics engine remains in GMod |
| Map | Attempts client-side brush-surface export, split into chunks; no textures, displacements, skybox, brush entities, or Source lighting |
| Weapons | Source processes firing and damage; Minecraft draws an approximate shot-direction tracer and shows Source health |
| View | F8 switches between Minecraft's camera and the exporting GMod player's camera |
| Controls | F9 enables forwarding movement, looking, attack, secondary attack, jump, use, and reload; the GMod server must opt in |

Missing conversion work includes skeletal animations/ragdoll bones, first-person
weapon animation, skins/bodygroups, textures, audio, detailed bullet spread/pellets,
the spawn/tool menus, weapon selection UI, particles, and arbitrary addon-specific
events. Props do not become native Minecraft entities or collidable blocks. Use the
GMod interface to choose a weapon/tool and spawn objects, then return to Minecraft
to view or control them. Unsupported meshes temporarily/permanently appear as bounding
boxes; map chunks without uploaded geometry are omitted.

## Windows installation

1. Install Minecraft **1.21.1** with [Fabric Loader](https://fabricmc.net/use/installer/)
   **0.16.10 or later**, and Fabric API for **1.21.1** (the build uses
   `0.102.1+1.21.1`). Install Garry's Mod through Steam.
2. Copy `release/gmod-live-bridge-0.1.0.jar` from the downloadable ZIP into your
   Minecraft instance's `mods` folder. For the default launcher this is
   `%APPDATA%\.minecraft\mods`. Prism/other launchers use their instance's directory.
3. Copy the entire `gmod-addon` directory into
   `Steam\steamapps\common\GarrysMod\garrysmod\addons\gmbridge`.
   The result must contain `addons\gmbridge\lua\autorun\client\gmbridge_client.lua`
   and `addons\gmbridge\lua\autorun\server\gmbridge_server.lua`. Don't overwrite an
   existing addon directory; use a fresh name if one already exists.
4. In Steam → Garry's Mod → Properties → Launch Options, **append**
   `-allowlocalhttp` to your existing options. This is required for the GMod client
   to contact the loopback relay. Restart GMod after changing it.
5. Install Python 3.10+ if needed. In PowerShell, for example:

   ```powershell
   winget install --id Python.Python.3.12 -e
   ```

   Open a new PowerShell window, change to the extracted project directory, and run:

   ```powershell
   py -3 relay\bridge.py
   ```

   Keep this terminal running. The relay has no extra Python dependencies. It binds
   only `127.0.0.1:8765`; it is not an Internet or multiplayer server.
6. Launch GMod, start a local Sandbox map, spawn a few physics props, and enable the
   developer console. Run:

   ```text
   gmbridge_enabled 1
   ```

   Look for `[GMod Bridge] Relay connected` in the console. Large maps load in chunks
   over several seconds. To permit input from Minecraft in your own local game, run:

   ```text
   gmbridge_allow_control 1
   ```

7. Launch Minecraft and enter a **separate test world**. A void Superflat world with
   cheats enabled works best, since native terrain can obscure imported geometry.
   Switch to spectator mode (`/gamemode spectator`) to avoid native-world collision
   and item actions interfering with the viewer. The GMod scene is anchored at the
   Minecraft player's current position when the stream first arrives. One Minecraft
   block corresponds to 40 Source units.
8. Press **F8** to follow GMod's camera. Press **F9** to enable controls. The overlay
   displays relay status, mode, entity count, mesh count, and GMod health.

When forwarding controls: WASD moves, mouse looks, left click attacks, right click
uses the secondary attack, Space jumps, E uses, and R reloads. Select the desired
weapon or physics gun in GMod before switching to Minecraft. Minecraft's menus pause
input forwarding; stale controls expire automatically. F9 disables forwarding and F8
restores Minecraft's camera. These keys can be rebound under Minecraft's Controls.
Prefer Minecraft first-person view while following the GMod camera.

## First local acceptance check

1. In GMod, spawn one simple `prop_physics`, for example a wooden crate or barrel.
2. In Minecraft, confirm the overlay says `Live` and that its mesh count increases.
3. Move and rotate the prop with GMod's physics gun. Confirm the geometry follows in
   Minecraft; this checks actual export, rendering, and live simulation together.
4. Fire a basic hitscan weapon in GMod. Check the visual tracer in Minecraft.
5. Enable GMod control, follow the camera with F8, enable F9, then test movement,
   physics-gun grab/release, and firing from the Minecraft window.
6. Disable F9 and verify GMod stops receiving movement/attack. Stop the relay and
   verify Minecraft reports disconnection and restores its own camera. Restart the
   relay; geometry should be re-exported automatically.

Report the Minecraft `logs/latest.log` and the `[GMod Bridge]` console messages if
this check fails. These game-level checks have **not** been executed in the cloud.

## Troubleshooting

- **Waiting for GMod:** check `gmbridge_enabled 1`, the addon directory layout,
  `-allowlocalhttp`, and that both games are on the relay's PC. GMod server-only
  installation is insufficient: mesh export runs in the GMod client.
- **No input effect:** the GMod server needs `gmbridge_allow_control 1`. This bridge
  controls only the exporting client's own player; it cannot control other players.
- **Bounding boxes:** wait for assets to upload. Unsupported or budget-limited models
  remain boxes. The GMod console reports rejected uploads.
- **Old geometry after changing assets:** run `gmbridge_restart` in the GMod console.
- **Slow or missing map:** set `gmbridge_export_map 0`, then `gmbridge_restart`.
  Continue with a small map and a few props.
- **Imported geometry hidden:** use a void world and spectator mode. The viewer does
  not suppress Minecraft terrain rendering.
- **Port already in use:** stop the other relay instance. Both addon and mod currently
  use port 8765; changing the relay port alone does not change the clients.

Limits: 256 snapshot entities (map chunks included), 128 cached meshes, 30,000
triangles per model, 300,000 cached triangles total, up to 64 map chunks, and 128
tracer events per snapshot. Geometry exceeding a budget is truncated or rejected.
Models are shared by model path: this version does not distinguish bodygroups or
skins. Exported meshes are held in relay memory and discarded on a new GMod session.
The packaged release contains our bridge code, not Source game assets.

## Build from source

Install a **JDK 21** (a JRE alone cannot compile), and ensure `java -version` and
`javac -version` both report 21. From the extracted project:

```powershell
cd minecraft-mod
.\gradlew.bat --no-daemon build
```

The remapped, installable JAR is `minecraft-mod/build/libs/gmod-live-bridge-0.1.0.jar`.
Do not install the `-sources.jar`. The Gradle 8.10.2 wrapper verifies its distribution
checksum. Linux/macOS: `./gradlew --no-daemon build` from `minecraft-mod`.

Run the relay integration tests from the project root:

```powershell
py -3 -m unittest discover -s tests -v
```

The Gradle build runs the Java networking test as well. It tests live HTTP parsing,
model caching, session changes, and stale-source handling; it does not launch either
game. The Python suite checks the real relay over loopback HTTP.

## Further development

Use this standalone checkout/directory; the old `aigunmod` repository is unrelated.
Each cloud task is already isolated; do not create a Git worktree unless requested.
The next substantial task is the Source asset pipeline: material/texture export,
weighted vertices and streamed bone transforms, then viewmodels and audio. Fidelity
requires testing against actual GMod assets and addons. Both games must keep running
for all authoritative Source gameplay; this bridge cannot run a Source simulation
inside Minecraft by itself.
