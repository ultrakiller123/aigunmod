package dev.gmodbridge;

import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import com.mojang.authlib.GameProfile;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientLifecycleEvents;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.fabricmc.fabric.api.client.rendering.v1.WorldRenderContext;
import net.fabricmc.fabric.api.client.rendering.v1.WorldRenderEvents;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.network.OtherClientPlayerEntity;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.VertexConsumer;
import net.minecraft.client.util.InputUtil;
import net.minecraft.entity.Entity;
import net.minecraft.text.Text;
import net.minecraft.util.math.Vec3d;
import org.joml.Matrix4f;
import org.lwjgl.glfw.GLFW;
import java.util.UUID;

public final class BridgeClient implements ClientModInitializer {
    private final BridgeNetwork network = new BridgeNetwork();
    private final KeyBinding followKey = new KeyBinding("Follow GMod camera", InputUtil.Type.KEYSYM,
            GLFW.GLFW_KEY_F8, "GMod Bridge");
    private final KeyBinding controlKey = new KeyBinding("Control GMod player", InputUtil.Type.KEYSYM,
            GLFW.GLFW_KEY_F9, "GMod Bridge");
    private boolean follow = false;
    private boolean control = false;
    private Vec3d anchor;
    private OtherClientPlayerEntity remoteCamera;
    private Entity previousCamera;
    private String session = "";

    @Override public void onInitializeClient() {
        KeyBindingHelper.registerKeyBinding(followKey);
        KeyBindingHelper.registerKeyBinding(controlKey);
        ClientTickEvents.END_CLIENT_TICK.register(this::tick);
        WorldRenderEvents.AFTER_ENTITIES.register(this::render);
        HudRenderCallback.EVENT.register((draw, tickCounter) -> {
            MinecraftClient client = MinecraftClient.getInstance();
            if (client.world == null) return;
            draw.drawTextWithShadow(client.textRenderer, "GMod Bridge: " + network.status, 8, 8, 0xFFFFFF);
            BridgeNetwork.Frame frame = network.frame;
            String mode = "F8 camera: " + (follow ? "GMod" : "Minecraft")
                    + " | F9 controls: " + (control ? "ON" : "OFF");
            if (frame != null) mode += " | GMod health: " + frame.health();
            draw.drawTextWithShadow(client.textRenderer, mode, 8, 20, 0xFFE080);
        });
        ClientLifecycleEvents.CLIENT_STOPPING.register(client -> network.stop());
        network.start();
    }

    private void tick(MinecraftClient client) {
        if (client.world == null || client.player == null) {
            remoteCamera = null;
            previousCamera = null;
            anchor = null;
            control = false;
            network.input = null;
            return;
        }
        BridgeNetwork.Frame frame = network.frame;
        while (followKey.wasPressed()) follow = !follow;
        while (controlKey.wasPressed()) {
            control = !control;
            if (control && frame != null) {
                client.player.setYaw((float) (-frame.eyeAngles()[1] - 90));
                client.player.setPitch((float) frame.eyeAngles()[0]);
                client.player.sendMessage(Text.literal("GMod control requires gmbridge_allow_control 1 on the GMod server."), false);
            }
        }
        if (frame == null) {
            restoreCamera(client);
            control = false;
            network.input = null;
            return;
        }
        if (anchor == null || !session.equals(frame.session())) {
            restoreCamera(client);
            session = frame.session();
            // Source origin is the exporting player's feet at stream start.
            anchor = client.player.getPos();
        }
        if (follow) {
            if (remoteCamera == null) {
                previousCamera = client.getCameraEntity();
                remoteCamera = new OtherClientPlayerEntity(client.world,
                        new GameProfile(UUID.fromString("b0bb7c8b-183b-4bd8-a874-515815528001"), "GModCamera"));
                client.setCameraEntity(remoteCamera);
            }
            Vec3d eye = mapped(frame.eye()).add(anchor);
            // A Minecraft player's camera has a standing eye-height offset.
            remoteCamera.refreshPositionAndAngles(eye.x, eye.y - remoteCamera.getStandingEyeHeight(), eye.z,
                    (float) (-frame.eyeAngles()[1] - 90), (float) frame.eyeAngles()[0]);
        } else restoreCamera(client);
        if (control && client.currentScreen == null) {
            JsonObject input = new JsonObject();
            input.addProperty("session", frame.session());
            JsonArray angles = new JsonArray();
            angles.add(Math.max(-89, Math.min(89, client.player.getPitch())));
            angles.add(normalize(-client.player.getYaw() - 90));
            input.add("angles", angles);
            input.addProperty("forward", (client.options.forwardKey.isPressed() ? 400 : 0)
                    - (client.options.backKey.isPressed() ? 400 : 0));
            input.addProperty("side", (client.options.rightKey.isPressed() ? 400 : 0)
                    - (client.options.leftKey.isPressed() ? 400 : 0));
            input.addProperty("attack", client.options.attackKey.isPressed());
            input.addProperty("attack2", client.options.useKey.isPressed());
            input.addProperty("jump", client.options.jumpKey.isPressed());
            input.addProperty("use", InputUtil.isKeyPressed(client.getWindow().getHandle(), GLFW.GLFW_KEY_E));
            input.addProperty("reload", InputUtil.isKeyPressed(client.getWindow().getHandle(), GLFW.GLFW_KEY_R));
            network.input = input.toString();
            network.inputUpdated = System.nanoTime();
        } else network.input = null;
    }

    private void restoreCamera(MinecraftClient client) {
        if (remoteCamera != null) {
            if (client.getCameraEntity() == remoteCamera) client.setCameraEntity(previousCamera != null ? previousCamera : client.player);
            remoteCamera = null;
            previousCamera = null;
        }
    }

    private static float normalize(float degrees) {
        return ((degrees + 180) % 360 + 360) % 360 - 180;
    }

    private static Vec3d mapped(double[] source) {
        return new Vec3d(source[0] * BridgeNetwork.SCALE, source[2] * BridgeNetwork.SCALE,
                -source[1] * BridgeNetwork.SCALE);
    }

    private void render(WorldRenderContext context) {
        BridgeNetwork.Frame frame = network.frame;
        if (frame == null || anchor == null || context.matrixStack() == null || context.consumers() == null) return;
        Vec3d camera = context.camera().getPos();
        VertexConsumer out = context.consumers().getBuffer(RenderLayer.getDebugQuads());
        Matrix4f root = context.matrixStack().peek().getPositionMatrix();
        for (BridgeNetwork.Entity entity : frame.entities()) {
            Vec3d offset = mapped(entity.pos()).add(anchor).subtract(camera);
            if (!entity.map() && offset.lengthSquared() > 256 * 256) continue;
            Matrix4f transform = new Matrix4f(root).translate((float) offset.x, (float) offset.y, (float) offset.z)
                    .rotateX((float) (-Math.PI / 2)).scale((float) BridgeNetwork.SCALE)
                    .rotateZ((float) Math.toRadians(entity.ang()[1]))
                    .rotateY((float) Math.toRadians(entity.ang()[0]))
                    .rotateX((float) Math.toRadians(entity.ang()[2]));
            float[] mesh = network.mesh(entity.key());
            if (mesh == null) {
                if (!entity.map()) drawBounds(out, transform, entity);
                continue;
            }
            for (int i = 0; i < mesh.length; i += 9) {
                float shade = shade(mesh, i);
                // Debug quads use POSITION_COLOR. Repeating the third vertex forms a triangle.
                vertex(out, transform, mesh, i, entity.color(), shade);
                vertex(out, transform, mesh, i + 3, entity.color(), shade);
                vertex(out, transform, mesh, i + 6, entity.color(), shade);
                vertex(out, transform, mesh, i + 6, entity.color(), shade);
            }
        }
        if (System.nanoTime() - frame.received() < 150_000_000L) {
            for (BridgeNetwork.Shot shot : frame.shots()) {
                Vec3d start = mapped(shot.start()).add(anchor).subtract(camera);
                Vec3d end = mapped(shot.end()).add(anchor).subtract(camera);
                Vec3d side = end.subtract(start).crossProduct(start.multiply(-1)).normalize().multiply(0.015);
                int[] color = {255, 210, 70, 230};
                point(out, root, start.add(side), color);
                point(out, root, end.add(side), color);
                point(out, root, end.subtract(side), color);
                point(out, root, start.subtract(side), color);
            }
        }
    }

    private static void point(VertexConsumer out, Matrix4f matrix, Vec3d p, int[] color) {
        out.vertex(matrix, (float) p.x, (float) p.y, (float) p.z).color(color[0], color[1], color[2], color[3]);
    }

    private static void vertex(VertexConsumer out, Matrix4f matrix, float[] values, int offset, int[] color, float shade) {
        out.vertex(matrix, values[offset], values[offset + 1], values[offset + 2])
                .color((int) (color[0] * shade), (int) (color[1] * shade), (int) (color[2] * shade), color[3]);
    }

    private static float shade(float[] vertices, int i) {
        float ax = vertices[i+3] - vertices[i], ay = vertices[i+4] - vertices[i+1], az = vertices[i+5] - vertices[i+2];
        float bx = vertices[i+6] - vertices[i], by = vertices[i+7] - vertices[i+1], bz = vertices[i+8] - vertices[i+2];
        float nx = ay*bz - az*by, ny = az*bx - ax*bz, nz = ax*by - ay*bx;
        double length = Math.sqrt(nx*nx + ny*ny + nz*nz);
        if (length < 0.00001) return 0.5f;
        return (float) (0.35 + 0.65 * Math.min(1, Math.abs(nx*0.35 + ny*0.25 + nz*0.9) / length));
    }

    private static void drawBounds(VertexConsumer out, Matrix4f matrix, BridgeNetwork.Entity entity) {
        double[] a = entity.mins(), b = entity.maxs();
        float[][] corners = {{(float)a[0],(float)a[1],(float)a[2]}, {(float)b[0],(float)a[1],(float)a[2]},
                {(float)b[0],(float)b[1],(float)a[2]}, {(float)a[0],(float)b[1],(float)a[2]},
                {(float)a[0],(float)a[1],(float)b[2]}, {(float)b[0],(float)a[1],(float)b[2]},
                {(float)b[0],(float)b[1],(float)b[2]}, {(float)a[0],(float)b[1],(float)b[2]}};
        int[][] faces = {{0,1,2,3},{4,7,6,5},{0,4,5,1},{1,5,6,2},{2,6,7,3},{3,7,4,0}};
        for (int[] face : faces) for (int corner : face) vertex(out, matrix, corners[corner], 0, entity.color(), 0.6f);
    }
}
