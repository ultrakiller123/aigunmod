package dev.gmodbridge;

import com.google.gson.*;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;

/** All HTTP and JSON work occurs off Minecraft's render thread. */
final class BridgeNetwork {
    static final double SCALE = 1.0 / 40.0;
    record Entity(int id, String key, double[] pos, double[] ang, double[] mins,
                  double[] maxs, int[] color, boolean map) {}
    record Shot(double[] start, double[] end) {}
    record Frame(String session, long sequence, List<Entity> entities, List<Shot> shots,
                 double[] eye, double[] eyeAngles, int health, long received) {}

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(1)).build();
    private final ScheduledExecutorService worker = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread thread = new Thread(r, "gmod-bridge-network");
        thread.setDaemon(true);
        return thread;
    });
    private final Map<String, float[]> meshes = new ConcurrentHashMap<>();
    private final String base;
    volatile Frame frame;
    volatile String status = "Waiting for relay";
    volatile String input;
    volatile long inputUpdated;
    private String session = "";
    private long lastSequence = -1;

    BridgeNetwork() { this("http://127.0.0.1:8765"); }
    BridgeNetwork(String base) { this.base = base; }

    void start() { worker.scheduleWithFixedDelay(this::poll, 0, 50, TimeUnit.MILLISECONDS); }
    void stop() { worker.shutdownNow(); }
    float[] mesh(String key) { return meshes.get(key); }

    private JsonObject get(String path) throws Exception {
        HttpResponse<String> response = http.send(HttpRequest.newBuilder(URI.create(base + path))
                .timeout(Duration.ofSeconds(2)).GET().build(), HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) throw new IllegalStateException("Relay HTTP " + response.statusCode());
        return JsonParser.parseString(response.body()).getAsJsonObject();
    }

    void poll() {
        try {
            JsonObject state = get("/state");
            if (!state.get("active").getAsBoolean()) {
                frame = null;
                status = "Relay connected; waiting for GMod";
                return;
            }
            String nextSession = state.get("session").getAsString();
            if (!nextSession.equals(session)) {
                session = nextSession;
                meshes.clear();
                frame = null;
                input = null;
                lastSequence = -1;
            }
            JsonObject snapshot = state.getAsJsonObject("snapshot");
            long sequence = snapshot.get("seq").getAsLong();
            if (sequence != lastSequence) {
                List<Entity> entities = new ArrayList<>();
                for (JsonElement value : snapshot.getAsJsonArray("entities")) {
                    JsonObject e = value.getAsJsonObject();
                    int[] color = new int[4];
                    for (int i = 0; i < 4; i++) color[i] = e.getAsJsonArray("color").get(i).getAsInt();
                    entities.add(new Entity(e.get("id").getAsInt(), e.get("model_key").getAsString(),
                            vector(e, "pos"), vector(e, "ang"), vector(e, "mins"), vector(e, "maxs"), color,
                            e.has("map") && e.get("map").getAsBoolean()));
                }
                List<Shot> shots = new ArrayList<>();
                for (JsonElement value : snapshot.getAsJsonArray("shots")) {
                    JsonObject s = value.getAsJsonObject();
                    shots.add(new Shot(vector(s, "start"), vector(s, "end")));
                }
                frame = new Frame(session, sequence, List.copyOf(entities), List.copyOf(shots),
                        vector(snapshot, "eye"), vector(snapshot, "eye_ang"),
                        snapshot.has("health") ? snapshot.get("health").getAsInt() : 0, System.nanoTime());
                lastSequence = sequence;
            }
            // Limit large asset requests so live state cannot be starved by map loading.
            for (JsonElement keyElement : state.getAsJsonArray("models")) {
                String key = keyElement.getAsString();
                if (meshes.containsKey(key)) continue;
                JsonArray vertices = get("/model?session=" + encode(session) + "&key=" + encode(key))
                        .getAsJsonArray("vertices");
                if (vertices.size() > 270_000 || vertices.size() % 9 != 0) throw new IllegalStateException("Invalid mesh");
                float[] mesh = new float[vertices.size()];
                for (int i = 0; i < mesh.length; i++) mesh[i] = vertices.get(i).getAsFloat();
                meshes.put(key, mesh);
                break;
            }
            String controls = input;
            if (controls != null && System.nanoTime() - inputUpdated < 200_000_000L) {
                http.send(HttpRequest.newBuilder(URI.create(base + "/input"))
                        .timeout(Duration.ofSeconds(1)).header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(controls)).build(), HttpResponse.BodyHandlers.discarding());
            }
            status = "Live | " + frame.entities().size() + " entities | " + meshes.size() + " meshes";
        } catch (Exception exception) {
            frame = null;
            status = "Bridge disconnected: " + exception.getClass().getSimpleName();
            if (exception instanceof InterruptedException) Thread.currentThread().interrupt();
        }
    }

    private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
    private static double[] vector(JsonObject object, String key) {
        JsonArray array = object.getAsJsonArray(key);
        return new double[]{array.get(0).getAsDouble(), array.get(1).getAsDouble(), array.get(2).getAsDouble()};
    }
}
