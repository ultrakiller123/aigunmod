# Validation record

Validated in the Linux cloud workspace on 2026-10-06:

- Minecraft 1.21.1 Fabric mod: Gradle 8.10.2 wrapper `build` completed successfully
  with JDK 21.0.8. Loom 1.8.13 produced the remapped installable JAR.
- Java HTTP networking integration test: **1 passed**, 0 failures/errors. Verifies
  geometry/state reception, asset caching, source session reset, and inactive source.
- Python relay HTTP integration suite: **4 passed**, 0 failures. Verifies state/mesh
  transfer, invalid/out-of-order messages, source reset, and expiring controls.
- Standalone `python3 relay/bridge.py --port 18765` started and returned the expected
  protocol/health payload over loopback HTTP; that temporary process was stopped.
- Both GMod Lua files parsed successfully with `luaparse` (Lua syntax only).
- Gradle distribution and downloaded Temurin JDK SHA-256 checksums were verified.
- The previous `/workspace/aigunmod` checkout remained unchanged.

**Not validated:** either game's graphical startup, GMod native API behavior,
actual map/model export, model rendering in a Minecraft world, or gameplay/input
synchronization between running games. Garry's Mod and a graphical session were
unavailable. Follow the README's local acceptance check to validate these.

The build required Fabric/Minecraft dependency domains in the cloud network policy.
The following additions were saved to the environment configuration draft:
`maven.fabricmc.net`, `piston-meta.mojang.com`, `piston-data.mojang.com`,
`libraries.minecraft.net`, `resources.download.minecraft.net`.
Their connectivity was sufficient for the successful build. Saving the draft does
not publish the environment: review and save it in environment settings, then publish
if you want to retain the cloud setup. No credentials were requested or saved.

The Windows package itself needs no access to this cloud relay; start its own local
relay on the PC running both games. Java compilation and HTTP tests are evidence for
the bridge infrastructure, not a claim of a completed or game-tested engine transfer.
