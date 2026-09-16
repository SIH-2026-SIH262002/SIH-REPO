package com.ner.logistics.driver;

import com.ner.logistics.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverProfileController {

    private final DriverProfileService driverProfileService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('LOGISTICS_OPERATOR')")
    public ResponseEntity<List<DriverProfile>> getAllDrivers() {
        return ResponseEntity.ok(driverProfileService.getAllDrivers());
    }

    @GetMapping("/available")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LOGISTICS_OPERATOR')")
    public ResponseEntity<List<DriverProfile>> getAvailableDrivers(
            @RequestParam(required = false) String requiredCategory) {
        return ResponseEntity.ok(driverProfileService.findAvailableDrivers(requiredCategory));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverProfile> getMyProfile(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(driverProfileService.getDriverByUsername(username));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LOGISTICS_OPERATOR') or hasRole('DRIVER')")
    public ResponseEntity<DriverProfile> getDriverById(@PathVariable Long id) {
        return ResponseEntity.ok(driverProfileService.getDriverById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('LOGISTICS_OPERATOR')")
    public ResponseEntity<DriverProfile> registerDriverProfile(@Valid @RequestBody DriverProfileDto dto) {
        return ResponseEntity.ok(driverProfileService.registerDriverProfile(dto));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LOGISTICS_OPERATOR')")
    public ResponseEntity<DriverProfile> updateOperationalStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Field 'status' is required");
        }
        return ResponseEntity.ok(driverProfileService.updateOperationalStatus(id, status));
    }

    @PutMapping("/{id}/fitness")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LOGISTICS_OPERATOR')")
    public ResponseEntity<DriverProfile> updateFitnessStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String fitness = body.get("fitnessStatus");
        if (fitness == null || fitness.isBlank()) {
            throw new IllegalArgumentException("Field 'fitnessStatus' is required");
        }
        return ResponseEntity.ok(driverProfileService.updateFitnessStatus(id, fitness));
    }

    @PutMapping("/me/location")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverProfile> updateMyLocation(
            Authentication authentication,
            @RequestBody Map<String, Double> body) {
        Double lat = body.get("latitude");
        Double lng = body.get("longitude");
        if (lat == null || lng == null) {
            throw new IllegalArgumentException("Both 'latitude' and 'longitude' are required");
        }
        return ResponseEntity.ok(driverProfileService.updateLocation(authentication.getName(), lat, lng));
    }
}
