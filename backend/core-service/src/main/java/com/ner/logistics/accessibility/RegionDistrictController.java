package com.ner.logistics.accessibility;

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
@RequestMapping("/api/districts/config")
@RequiredArgsConstructor
public class RegionDistrictController {

    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAuthority('DISTRICT_MANAGE') or hasAuthority('REGION_MANAGE') or hasAuthority('ROAD_STATUS_VIEW')")
    public ResponseEntity<List<DistrictConfigDto>> getDistrictConfigs() {
        List<DistrictConfigDto> districts = List.of(
                DistrictConfigDto.builder()
                        .districtCode("DIST-DIMA-HASAO")
                        .districtName("Dima Hasao")
                        .stateName("Assam")
                        .operationalSector("Sector 4 - Hill Corridor")
                        .emergencyZone("Haflong Control Zone")
                        .centerLatitude(25.1833)
                        .centerLongitude(92.8333)
                        .active(true)
                        .build(),
                DistrictConfigDto.builder()
                        .districtCode("DIST-CACHAR")
                        .districtName("Cachar")
                        .stateName("Assam")
                        .operationalSector("Sector 5 - Barak Valley")
                        .emergencyZone("Silchar Control Zone")
                        .centerLatitude(24.8333)
                        .centerLongitude(92.7789)
                        .active(true)
                        .build()
        );
        return ResponseEntity.ok(districts);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('DISTRICT_MANAGE') or hasAuthority('REGION_MANAGE')")
    public ResponseEntity<DistrictConfigDto> createDistrictConfig(@RequestBody DistrictConfigDto dto,
                                                                  @AuthenticationPrincipal User actor) {
        auditService.logDetailedEvent(
                actor != null ? actor.getUsername() : "ADMIN",
                actor != null ? actor.getRole().name() : "ADMIN",
                "DISTRICT_CONFIGURED",
                "DistrictConfig",
                dto.getDistrictCode(),
                null,
                dto.getOperationalSector(),
                "Configured district operational sector: " + dto.getDistrictName(),
                null,
                "SUCCESS"
        );
        return ResponseEntity.ok(dto);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DistrictConfigDto {
        private String districtCode;
        private String districtName;
        private String stateName;
        private String operationalSector;
        private String emergencyZone;
        private double centerLatitude;
        private double centerLongitude;
        private boolean active;
    }
}
