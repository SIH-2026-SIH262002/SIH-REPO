package com.ner.logistics.vehicle.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleJourneyDetailsDto {

    private String vehicleCode;
    private String driverName;
    private String status;
    private String riskLevel;
    private Double speedKmh;
    private Double headingDegrees;
    private String lastUpdatedTime;
    private String commodityType;

    private LocationPoint origin;
    private LocationPoint currentLocation;
    private LocationPoint destination;

    private Double totalDistanceKm;
    private Double distanceRemainingKm;
    private String eta;

    private RouteDetails primaryRoute;
    private RouteDetails alternativeRoute;

    private List<HazardImpactDto> activeHazards;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationPoint {
        private String name;
        private Double lat;
        private Double lng;
        private String address;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteDetails {
        private String name;
        private Double distanceKm;
        private Double durationHours;
        private String riskLevel;
        private String reason;
        private Double distanceDifferenceKm;
        private Double timeDifferenceHours;
        private List<List<Double>> coords; // [[lat, lng], [lat, lng], ...]
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HazardImpactDto {
        private String id;
        private String title;
        private String type; // LANDSLIDE, FLOOD, ROAD_DAMAGE
        private String severity; // CRITICAL, HIGH, MEDIUM
        private Double lat;
        private Double lng;
        private String affectsRoute; // PRIMARY, ALTERNATIVE, PROXIMITY
    }
}
