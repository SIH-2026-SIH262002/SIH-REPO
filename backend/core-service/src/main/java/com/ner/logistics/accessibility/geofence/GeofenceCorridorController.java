package com.ner.logistics.accessibility.geofence;

import com.ner.logistics.audit.AuditService;
import com.ner.logistics.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/geofences")
@RequiredArgsConstructor
public class GeofenceCorridorController {

    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAuthority('GEOFENCE_MANAGE') or hasAuthority('RISK_CORRIDOR_MANAGE') or hasAuthority('ROAD_STATUS_VIEW')")
    public ResponseEntity<List<GeofenceZoneDto>> getGeofenceZones() {
        List<GeofenceZoneDto> zones = List.of(
                GeofenceZoneDto.builder()
                        .zoneId("ZONE-DIMA-HASAO-PASS")
                        .name("Haflong Mountain Pass Hazard Zone")
                        .riskType("LANDSLIDE")
                        .riskLevel("CRITICAL")
                        .centerLatitude(25.1833)
                        .centerLongitude(92.8333)
                        .radiusMeters(15000.0)
                        .active(true)
                        .description("High-susceptibility slope instability zone along NH-27")
                        .build(),
                GeofenceZoneDto.builder()
                        .zoneId("ZONE-SILCHAR-LOWLAND")
                        .name("Cachar Flood-Prone Sector")
                        .riskType("FLOOD")
                        .riskLevel("HIGH")
                        .centerLatitude(24.8333)
                        .centerLongitude(92.7789)
                        .radiusMeters(20000.0)
                        .active(true)
                        .description("Barak River basin inundation zone")
                        .build()
        );
        return ResponseEntity.ok(zones);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('GEOFENCE_MANAGE') or hasAuthority('RISK_CORRIDOR_MANAGE')")
    public ResponseEntity<GeofenceZoneDto> createGeofenceZone(@RequestBody GeofenceZoneDto dto,
                                                              @AuthenticationPrincipal User actor) {
        auditService.logDetailedEvent(
                actor != null ? actor.getUsername() : "ADMIN",
                actor != null ? actor.getRole().name() : "ADMIN",
                "GEOFENCE_CREATED",
                "GeofenceZone",
                dto.getZoneId(),
                null,
                dto.getRiskLevel(),
                dto.getDescription() != null ? dto.getDescription() : "Geofence hazard zone defined",
                null,
                "SUCCESS"
        );
        return ResponseEntity.ok(dto);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeofenceZoneDto {
        private String zoneId;
        private String name;
        private String riskType;
        private String riskLevel;
        private double centerLatitude;
        private double centerLongitude;
        private double radiusMeters;
        private boolean active;
        private String description;
    }
}
