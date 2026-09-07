package com.ner.logistics.tracking;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * Local Write-Behind Telemetry Buffer.
 * Addresses Architecture Review Item #4: Prevents telemetry loss during Kafka/broker or DB outages.
 */
@Slf4j
@Component
public class TelemetryWriteBehindBuffer {

    private final Queue<BufferedTelemetryPoint> bufferQueue = new ConcurrentLinkedQueue<>();
    private static final int MAX_BUFFER_CAPACITY = 5000;

    @Data
    @Builder
    public static class BufferedTelemetryPoint {
        private String vehicleCode;
        private Double latitude;
        private Double longitude;
        private Double speed;
        private long timestampEpochSec;
    }

    public void enqueue(BufferedTelemetryPoint point) {
        if (bufferQueue.size() >= MAX_BUFFER_CAPACITY) {
            bufferQueue.poll(); // Evict oldest if capacity exceeded
            log.warn("⚠️ Telemetry write-behind buffer at capacity! Evicted oldest point.");
        }
        bufferQueue.add(point);
        log.info("📥 Telemetry point buffered for vehicle {} (Queue size={})", point.getVehicleCode(), bufferQueue.size());
    }

    public int getQueueSize() {
        return bufferQueue.size();
    }

    public Queue<BufferedTelemetryPoint> drainBuffer() {
        return bufferQueue;
    }
}
