# Garry’s Mod → Minecraft live bridge

Initial bridge prototype for Minecraft Java **1.21.1 + Fabric**, with both games running on the same Windows PC. Garry’s Mod remains authoritative for physics and gameplay; the client streams static model geometry, simulation poses, camera state, and bullet traces to Minecraft. Optional controls travel back to GMod.

## Downloads

- [Full package: mod JAR, GMod addon, relay, source, Gradle wrapper, and instructions](https://github.com/ultrakiller123/aigunmod/raw/refs/heads/main/downloads/gmod-minecraft-bridge-0.1.0.zip)
- [Smaller runtime package: mod JAR, GMod addon, relay, and instructions](https://github.com/ultrakiller123/aigunmod/raw/refs/heads/main/downloads/gmod-minecraft-bridge-runtime-0.1.0.zip)
- [Windows installation and local acceptance check](bridge/README.md#windows-installation)

**Status:** The Fabric build and five networking tests pass. Lua syntax and standalone relay startup were checked. Live gameplay has not been tested; this cloud environment has neither Garry’s Mod nor a graphical game session.

Full gameplay transfer is unfinished: textures, skeletal animations, audio, weapon interfaces, and addon-specific behavior need further work. See [the implementation limits](bridge/README.md) and [validation record](bridge/VALIDATION.md).

The archives contain bridge code, not Source game assets. Geometry is exported from your own running GMod client.
