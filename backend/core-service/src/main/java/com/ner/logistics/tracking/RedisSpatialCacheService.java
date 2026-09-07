package com.ner.logistics.tracking;

import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Redis Spatial Cache Service (GEOADD & GEORADIUS abstraction).
 * Addresses Architecture Review Item #10: Caches vehicle spatial coordinates in Redis to prevent PostGIS choke under telemetry load.
 */
@Slf4j
@Service
public class RedisSpatialCacheService {

    // Simulated Redis GEO spatial cache index
    private final Map<String, VehicleGeoPoint> redisGeoStore = new ConcurrentHashMap<>();

    @Data
    @Builder
    public static class VehicleGeoPoint {
        private String vehicleCode;
        private double longitude;
        private double latitude;
        private long updatedEpochSec;
    }

    /**
     * Executes Redis GEOADD key longitude latitude member
     */
    public void geoAddVehicleLocation(String vehicleCode, double longitude, double latitude) {
        VehicleGeoPoint point = VehicleGeoPoint.builder()
                .vehicleCode(vehicleCode)
                .longitude(longitude)
                .latitude(latitude)
                .updatedEpochSec(System.currentTimeMillis() / 1000L)
                .build();

        redisGeoStore.put(vehicleCode, point);
        log.info("📍 Redis GEOADD: Vehicle {} updated at ({}, {})", vehicleCode, latitude, longitude);
    }

    /**
     * Executes Redis GEORADIUS key longitude latitude radius km WITHDIST
     */
    public List<VehicleGeoPoint> geoRadiusSearch(double centerLat, double centerLng, double radiusKm) {
        List<VehicleGeoPoint> results = new ArrayList<>();
        for (VehicleGeoPoint p : redisGeoStore.values()) {
            double distKm = haversineDistanceKm(centerLat, centerLng, p.getLatitude(), p.getLongitude());
            if (distKm <= radiusKm) {
                results.add(p);
            }
        }
        return results;
    }

    private double haversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6371.0 * c; // Earth radius in km
    }
}
