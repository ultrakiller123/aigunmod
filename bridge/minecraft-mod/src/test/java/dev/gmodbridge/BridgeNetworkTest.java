package dev.gmodbridge;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class BridgeNetworkTest {
    @Test void realHttpCarriesMeshesAndResetsCacheAcrossSessions() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        AtomicInteger downloads = new AtomicInteger();
        String[] session = {"gmod1"};
        boolean[] active = {true};
        server.createContext("/state", exchange -> {
            String response = """
                {"active": %s, "session": "%s", "models": ["prop"], "snapshot": {
                  "seq": 1, "entities": [{"id": 9, "model_key": "prop", "pos": [40,80,120],
                  "ang": [0,90,0], "mins": [-1,-1,-1], "maxs": [1,1,1], "color": [20,40,60,255]}],
                  "eye": [0,0,64], "eye_ang": [10,90,0], "health": 72,
                  "shots": [{"start": [0,0,64], "end": [100,0,64]}]}}
                """.formatted(active[0], session[0]);
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.createContext("/model", exchange -> {
            downloads.incrementAndGet();
            byte[] bytes = "{\"vertices\":[0,0,0,40,0,0,0,40,0]}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        BridgeNetwork client = new BridgeNetwork("http://127.0.0.1:" + server.getAddress().getPort());
        try {
            client.poll();
            assertNotNull(client.frame);
            assertEquals(72, client.frame.health());
            assertEquals(9, client.frame.entities().getFirst().id());
            assertArrayEquals(new double[]{40,80,120}, client.frame.entities().getFirst().pos());
            assertEquals(1, client.frame.shots().size());
            assertArrayEquals(new float[]{0,0,0,40,0,0,0,40,0}, client.mesh("prop"));
            client.poll();
            assertEquals(1, downloads.get(), "unchanged meshes should be cached");
            session[0] = "gmod2";
            client.poll();
            assertEquals("gmod2", client.frame.session());
            assertEquals(2, downloads.get(), "new source sessions must reload assets");
            active[0] = false;
            client.poll();
            assertNull(client.frame, "stale GMod state must stop rendering");
        } finally {
            client.stop();
            server.stop(0);
        }
    }
}
