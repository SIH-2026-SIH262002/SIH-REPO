package com.ner.logistics.driver;

import com.ner.logistics.user.User;
import com.ner.logistics.user.UserRepository;
import com.ner.logistics.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DriverProfileService {

    private final DriverProfileRepository driverProfileRepository;
    private final UserRepository userRepository;

    public List<DriverProfile> getAllDrivers() {
        return driverProfileRepository.findAll();
    }

    public DriverProfile getDriverById(Long id) {
        return driverProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found with ID: " + id));
    }

    public DriverProfile getDriverByUsername(String username) {
        return driverProfileRepository.findByUserUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found for user: " + username));
    }

    @Transactional
    public DriverProfile registerDriverProfile(DriverProfileDto dto) {
        User user;
        if (dto.getUserId() != null) {
            user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + dto.getUserId()));
        } else if (dto.getUsername() != null) {
            user = userRepository.findByUsername(dto.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + dto.getUsername()));
        } else {
            throw new IllegalArgumentException("Either userId or username must be provided to register driver profile");
        }

        if (user.getRole() != UserRole.DRIVER) {
            throw new IllegalArgumentException("User " + user.getUsername() + " does not have role DRIVER. Current role: " + user.getRole());
        }

        if (driverProfileRepository.findByUserId(user.getId()).isPresent()) {
            throw new IllegalStateException("Driver profile already exists for user: " + user.getUsername());
        }

        DriverProfile profile = DriverProfile.builder()
                .user(user)
                .licenseNumber(dto.getLicenseNumber())
                .licenseCategory(dto.getLicenseCategory())
                .licenseExpiry(dto.getLicenseExpiry())
                .operationalStatus(dto.getOperationalStatus() != null ? dto.getOperationalStatus() : "ACTIVE")
                .fitnessStatus(dto.getFitnessStatus() != null ? dto.getFitnessStatus() : "FIT")
                .baseDepot(dto.getBaseDepot() != null ? dto.getBaseDepot() : user.getDistrict())
                .currentLatitude(dto.getCurrentLatitude())
                .currentLongitude(dto.getCurrentLongitude())
                .lastLocationUpdate(dto.getCurrentLatitude() != null ? LocalDateTime.now() : null)
                .assignedVehicleCode(dto.getAssignedVehicleCode())
                .emergencyContactName(dto.getEmergencyContactName())
                .emergencyContactPhone(dto.getEmergencyContactPhone())
                .build();

        return driverProfileRepository.save(profile);
    }

    @Transactional
    public DriverProfile updateOperationalStatus(Long id, String status) {
        DriverProfile profile = getDriverById(id);
        profile.setOperationalStatus(status);
        log.info("Driver #{} ({}) operational status updated to {}", id, profile.getUser().getUsername(), status);
        return driverProfileRepository.save(profile);
    }

    @Transactional
    public DriverProfile updateFitnessStatus(Long id, String fitnessStatus) {
        DriverProfile profile = getDriverById(id);
        profile.setFitnessStatus(fitnessStatus);
        if ("UNABLE_TO_CONTINUE".equalsIgnoreCase(fitnessStatus)) {
            profile.setOperationalStatus("HANDOVER_REQUIRED");
        }
        log.info("Driver #{} ({}) fitness status updated to {}", id, profile.getUser().getUsername(), fitnessStatus);
        return driverProfileRepository.save(profile);
    }

    @Transactional
    public DriverProfile updateLocation(String username, Double lat, Double lng) {
        DriverProfile profile = getDriverByUsername(username);
        profile.setCurrentLatitude(lat);
        profile.setCurrentLongitude(lng);
        profile.setLastLocationUpdate(LocalDateTime.now());
        return driverProfileRepository.save(profile);
    }

    public List<DriverProfile> findAvailableDrivers(String requiredCategory) {
        List<DriverProfile> candidates = driverProfileRepository.findByOperationalStatusAndFitnessStatus("ACTIVE", "FIT");
        return candidates.stream()
                .filter(d -> d.getAssignedVehicleCode() == null && d.getActiveShipmentId() == null)
                .filter(d -> requiredCategory == null || requiredCategory.equalsIgnoreCase(d.getLicenseCategory()) || "TRANS_HEAVY".equalsIgnoreCase(d.getLicenseCategory()))
                .toList();
    }
}
