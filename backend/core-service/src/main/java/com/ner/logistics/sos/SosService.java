package com.ner.logistics.sos;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SosService {

    private final SosEventRepository sosEventRepository;
    private final SosAckRepository sosAckRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final GeometryFactory geometryFactory = new GeometryFactory();

    @Transactional
    public SosEvent triggerSos(SosRequestDto dto, String username) {
        // Step 18: SOS Duplicate Detection (same vehicle created within last 5 minutes)
        List<SosEvent> activeSos = sosEventRepository.findByVehicleCodeAndStatusNot(
                dto.getVehicleCode() != null ? dto.getVehicleCode() : "NER-07", "RESOLVED");

        LocalDateTime fiveMinsAgo = LocalDateTime.now().minusMinutes(5);
        Optional<SosEvent> recentOpt = activeSos.stream()
                .filter(e -> e.getCreatedAt() != null && e.getCreatedAt().isAfter(fiveMinsAgo))
                .findFirst();

        if (recentOpt.isPresent()) {
            SosEvent existing = recentOpt.get();
            existing.setMessage("UPDATED: " + (dto.getMessage() != null ? dto.getMessage() : "Repeated SOS trigger"));
            sosEventRepository.save(existing);
            log.info("ℹ️ SOS DEDUPLICATED: Vehicle {} updated existing active SOS #{}", dto.getVehicleCode(), existing.getId());
            return existing;
        }

        Point spatialPoint = geometryFactory.createPoint(new Coordinate(dto.getLongitude(), dto.getLatitude()));
        spatialPoint.setSRID(4326);

        SosEvent event = SosEvent.builder()
                .triggeredBy(username != null ? username : "DRIVER_CONVOY")
                .vehicleCode(dto.getVehicleCode() != null ? dto.getVehicleCode() : "NER-07")
                .location(spatialPoint)
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .emergencyType(dto.getEmergencyType() != null ? dto.getEmergencyType() : "HARDWARE_PANIC_BUTTON")
                .message(dto.getMessage() != null ? dto.getMessage() : "Panic button triggered on telematics hardware wire")
                .status("TRIGGERED")
                .deliveryType("DIRECT_CELLULAR")
                .originTimestamp(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        SosEvent savedEvent = sosEventRepository.save(event);
        log.warn("🚨 SOS TRIGGERED by user={}, vehicle={}, location=({}, {})", username, dto.getVehicleCode(), dto.getLatitude(), dto.getLongitude());

        messagingTemplate.convertAndSend("/topic/sos-alerts", savedEvent);
        return savedEvent;
    }

    @Transactional
    public void processHardwareSosTrigger(String vehicleCode, Double lat, Double lng) {
        List<SosEvent> activeSos = sosEventRepository.findByVehicleCodeAndStatusNot(vehicleCode, "RESOLVED");
        LocalDateTime fiveMinsAgo = LocalDateTime.now().minusMinutes(5);
        boolean recentExists = activeSos.stream().anyMatch(e -> e.getCreatedAt() != null && e.getCreatedAt().isAfter(fiveMinsAgo));

        if (recentExists) {
            log.info("ℹ️ HARDWARE SOS DEDUPLICATED: Vehicle {} sent repeated panic wire signal within 5 min window.", vehicleCode);
            return;
        }

        SosRequestDto dto = SosRequestDto.builder()
                .vehicleCode(vehicleCode)
                .latitude(lat)
                .longitude(lng)
                .emergencyType("HARDWARE_PANIC_BUTTON")
                .message("AIS-140 Panic button physically pressed in vehicle cab")
                .build();

        triggerSos(dto, "HARDWARE_AIS140");
    }

    @Transactional
    public SosEvent processRelayedSos(SosRelayRequestDto dto) {
        if (dto.getHopCount() != null && dto.getHopCount() > 5) {
            log.warn("⚠️ REJECTED SOS MESH RELAY: Packet {} exceeded max 5 hops (hopCount={})", dto.getMeshPacketId(), dto.getHopCount());
            throw new IllegalArgumentException("REJECTED: Mesh packet exceeded maximum allowed 5 hops");
        }

        Optional<SosEvent> existingOpt = sosEventRepository.findByMeshPacketId(dto.getMeshPacketId());
        if (existingOpt.isPresent()) {
            log.info("ℹ️ DUPLICATE SOS MESH RELAY IGNORED: Packet {} was already delivered by a previous relay vehicle.", dto.getMeshPacketId());
            return existingOpt.get();
        }

        Point spatialPoint = geometryFactory.createPoint(new Coordinate(dto.getOriginLongitude(), dto.getOriginLatitude()));
        spatialPoint.setSRID(4326);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime originTime = dto.getOriginTimestamp() != null ? dto.getOriginTimestamp() : now.minusMinutes(15);
        long latency = Math.max(0, Duration.between(originTime, now).toMinutes());

        SosEvent event = SosEvent.builder()
                .meshPacketId(dto.getMeshPacketId())
                .triggeredBy("OFFLINE_SHADOW_ZONE_DRIVER")
                .vehicleCode(dto.getOriginVehicleCode())
                .location(spatialPoint)
                .latitude(dto.getOriginLatitude())
                .longitude(dto.getOriginLongitude())
                .emergencyType(dto.getEmergencyType() != null ? dto.getEmergencyType() : "LANDSLIDE_TRAPPED")
                .message(dto.getMessage() != null ? dto.getMessage() : "Offline P2P Mesh SOS: Vehicle trapped in zero connectivity shadow zone")
                .status("RECEIVED")
                .deliveryType("MESH_RELAY_STORE_FORWARD")
                .relayedByVehicle(dto.getRelayedByVehicleCode())
                .relayHopCount(dto.getHopCount() != null ? dto.getHopCount() : 1)
                .relayLatencyMinutes(latency)
                .pathAccumulator(dto.getPathAccumulator() != null ? dto.getPathAccumulator() : dto.getOriginVehicleCode() + " -> " + dto.getRelayedByVehicleCode())
                .crcChecksum(dto.getCrcChecksum() != null ? dto.getCrcChecksum() : "VALID_CRC32")
                .originTimestamp(originTime)
                .createdAt(now)
                .build();

        SosEvent savedEvent = sosEventRepository.save(event);
        log.warn("⚡ MESH RELAYED SOS RECEIVED & SAVED: Origin Vehicle={}, Trapped Location=({}, {}), Carried by Vehicle={}, Latency={} mins",
                dto.getOriginVehicleCode(), dto.getOriginLatitude(), dto.getOriginLongitude(), dto.getRelayedByVehicleCode(), latency);

        SosAck ack = SosAck.builder()
                .meshPacketId(dto.getMeshPacketId())
                .originVehicleCode(dto.getOriginVehicleCode())
                .status("DELIVERED_TO_COMMAND")
                .dispatchDetails("SOS received at Central Command at " + now.toLocalTime() + ". Haflong Rescue Team alerted.")
                .ackTimestamp(now)
                .build();
        sosAckRepository.save(ack);

        messagingTemplate.convertAndSend("/topic/sos-alerts", savedEvent);
        return savedEvent;
    }

    public SosEvent getSosById(Long id) {
        return sosEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SOS event not found with ID: " + id));
    }

    @Transactional
    public SosEvent acknowledgeSos(Long id, String username) {
        SosEvent event = getSosById(id);
        event.setStatus("ACKNOWLEDGED");
        event.setAcknowledgedBy(username != null ? username : "CENTRAL_COMMAND");
        event.setAcknowledgedAt(LocalDateTime.now());
        SosEvent updated = sosEventRepository.save(event);
        messagingTemplate.convertAndSend("/topic/sos-alerts", updated);
        log.info("✅ SOS event #{} ACKNOWLEDGED by {}", id, username);
        return updated;
    }

    @Transactional
    public SosEvent assignResponder(Long id, String responderName) {
        SosEvent event = getSosById(id);
        event.setStatus("RESPONDER_ASSIGNED");
        event.setAssignedResponder(responderName != null ? responderName : "Haflong Sector Emergency Team");
        SosEvent updated = sosEventRepository.save(event);
        messagingTemplate.convertAndSend("/topic/sos-alerts", updated);
        log.info("👮 SOS event #{} assigned to responder: {}", id, responderName);
        return updated;
    }

    @Transactional
    public SosEvent resolveSos(Long id, String resolutionNotes) {
        SosEvent event = getSosById(id);
        event.setStatus("RESOLVED");
        event.setResolvedAt(LocalDateTime.now());
        event.setResolutionNotes(resolutionNotes != null ? resolutionNotes : "Emergency situation resolved, vehicle evacuated successfully.");
        SosEvent updated = sosEventRepository.save(event);
        messagingTemplate.convertAndSend("/topic/sos-alerts", updated);
        log.info("🏁 SOS event #{} RESOLVED. Notes: {}", id, resolutionNotes);
        return updated;
    }

    @Transactional
    public SosEvent markFalseAlarm(Long id, String reason) {
        SosEvent event = getSosById(id);
        event.setStatus("FALSE_ALARM");
        event.setResolvedAt(LocalDateTime.now());
        event.setResolutionNotes("FALSE ALARM: " + (reason != null ? reason : "Operator verified as false alarm"));
        SosEvent updated = sosEventRepository.save(event);
        messagingTemplate.convertAndSend("/topic/sos-alerts", updated);
        log.info("ℹ️ SOS event #{} marked as FALSE_ALARM. Reason: {}", id, reason);
        return updated;
    }

    public List<SosEvent> getActiveSosEvents() {
        return sosEventRepository.findByStatusNot("RESOLVED");
    }

    public List<SosAck> getActiveAcks() {
        return sosAckRepository.findAll();
    }
}
