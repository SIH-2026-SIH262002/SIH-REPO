package com.ner.logistics.vehicle;

import com.ner.logistics.vehicle.dto.VehicleJourneyDetailsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public Vehicle getVehicleByCode(String code) {
        return vehicleRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found with code: " + code));
    }

    public VehicleJourneyDetailsDto getJourneyDetailsByCode(String code) {
        Vehicle vehicle = vehicleRepository.findByCode(code).orElse(null);
        String driverName = (vehicle != null && vehicle.getAssignedDriverUsername() != null) 
                ? vehicle.getAssignedDriverUsername() 
                : "Bikash Gogoi";

        VehicleJourneyDetailsDto dto = new VehicleJourneyDetailsDto();
        dto.setVehicleCode(code);
        dto.setDriverName(driverName);
        dto.setStatus(vehicle != null ? vehicle.getStatus() : "ON_TRACK");
        dto.setRiskLevel("HIGH");
        dto.setSpeedKmh(48.5);
        dto.setHeadingDegrees(135.0);
        dto.setLastUpdatedTime("Just now");
        dto.setCommodityType("Emergency Medicines");

        dto.setOrigin(new VehicleJourneyDetailsDto.LocationPoint("Guwahati Hub (Khanapara)", 26.1445, 91.7362, "Guwahati Freight Terminal"));
        dto.setCurrentLocation(new VehicleJourneyDetailsDto.LocationPoint("NH-27 Haflong Pass Sector", 25.1500, 92.7000, "Haflong Pass, Dima Hasao"));
        dto.setDestination(new VehicleJourneyDetailsDto.LocationPoint("Silchar Civil Hospital Depot", 24.8333, 92.7789, "Silchar Central Depot"));

        dto.setTotalDistanceKm(315.0);
        dto.setDistanceRemainingKm(142.5);
        dto.setEta("4h 20m");

        // Primary Route Coordinates
        List<List<Double>> primaryCoords = List.of(
                List.of(26.1445, 91.7362),
                List.of(25.5788, 91.8933),
                List.of(25.2200, 92.9500),
                List.of(25.1500, 92.7000),
                List.of(24.8333, 92.7789)
        );

        dto.setPrimaryRoute(new VehicleJourneyDetailsDto.RouteDetails(
                "NH-27 Guwahati-Silchar Primary Corridor",
                315.0,
                7.5,
                "HIGH",
                "Primary National Highway corridor",
                0.0,
                0.0,
                primaryCoords
        ));

        // Alternative Bypass Route Coordinates
        List<List<Double>> altCoords = List.of(
                List.of(26.1445, 91.7362),
                List.of(25.7500, 93.1700),
                List.of(25.1800, 93.0200),
                List.of(24.8333, 92.7789)
        );

        dto.setAlternativeRoute(new VehicleJourneyDetailsDto.RouteDetails(
                "SH-51 Lumding-Silchar Bypass Pass",
                333.0,
                8.1,
                "LOW",
                "✨ AI RECOMMENDED: Avoids 400m earth slip blockage at Haflong Pass",
                18.0,
                0.6,
                altCoords
        ));

        // Active Hazards
        dto.setActiveHazards(List.of(
                new VehicleJourneyDetailsDto.HazardImpactDto(
                        "hz-101",
                        "Landslide Earth Slip Blockage",
                        "LANDSLIDE",
                        "CRITICAL",
                        25.1500,
                        92.7000,
                        "PRIMARY"
                ),
                new VehicleJourneyDetailsDto.HazardImpactDto(
                        "hz-102",
                        "Torrential Rain Surface Water Saturated",
                        "FLOOD",
                        "HIGH",
                        25.2200,
                        92.9500,
                        "PROXIMITY"
                )
        ));

        return dto;
    }

    @Transactional
    public Vehicle updateVehicleStatus(String code, String status) {
        Vehicle vehicle = getVehicleByCode(code);
        vehicle.setStatus(status.toUpperCase());
        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public Vehicle assignDriverToVehicle(String vehicleCode, String driverUsername) {
        Optional<Vehicle> existingAssignment = vehicleRepository.findByAssignedDriverUsername(driverUsername);
        if (existingAssignment.isPresent() && !existingAssignment.get().getCode().equals(vehicleCode)) {
            throw new IllegalArgumentException("Driver " + driverUsername + " is already assigned to active vehicle " + existingAssignment.get().getCode());
        }

        Vehicle vehicle = getVehicleByCode(vehicleCode);
        vehicle.setAssignedDriverUsername(driverUsername);
        vehicle.setStatus("ASSIGNED");
        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public Vehicle unassignDriver(String vehicleCode) {
        Vehicle vehicle = getVehicleByCode(vehicleCode);
        vehicle.setAssignedDriverUsername(null);
        vehicle.setStatus("AVAILABLE");
        return vehicleRepository.save(vehicle);
    }
}
