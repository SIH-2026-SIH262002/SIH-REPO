package com.ner.logistics.routing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ner.logistics.incident.Incident;
import com.ner.logistics.incident.IncidentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Real GraphHopper routing client. This service used to return hardcoded
 * Guwahati-Silchar waypoints/distances/ETAs regardless of what was requested
 * -- that fabricated data has been removed. It now actually calls the
 * self-hosted GraphHopper instance (same GRAPHHOPPER_URL convention as
 * backend/app/services/routing_service.py) for real route geometry/distance/
 * duration, and decides whether to reroute based on genuine active-incident
 * proximity to the computed route (via IncidentRepository's PostGIS
 * ST_DWithin query) rather than "any incident exists anywhere in the DB".
 *
 * If GraphHopper cannot be reached, this NEVER invents a distance/ETA -- the
 * corresponding fields are left null and rerouteReason says so explicitly.
 *
 * NOTE: this Java core-service is not started by docker/docker-compose.yml
 * and is not called by any current web-dashboard/mobile-app code (both talk
 * exclusively to the Python FastAPI backend on :8000, which has its own real
 * GraphHopper client in routing_service.py). This fix keeps this class from
 * being a "fake GraphHopper" landmine if/when this service is ever wired up,
 * but it is not on the live execution path today.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GraphHopperRoutingService {

    private static final double INCIDENT_PROXIMITY_METERS = 15_000.0; // 15km corridor-relevance radius

    private final IncidentRepository incidentRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @Value("${graphhopper.url:${GRAPHHOPPER_URL:http://localhost:8989}}")
    private String graphHopperUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .build();

    public RouteResponseDto calculateRoute(RouteRequestDto request) {
        double originLat = request.getOriginLat();
        double originLng = request.getOriginLng();
        double destLat = request.getDestLat();
        double destLng = request.getDestLng();

        GraphHopperRoute primary = queryGraphHopper(originLat, originLng, destLat, destLng);
        List<Incident> activeIncidents = incidentRepository.findByStatus("ACTIVE");
        Incident corridorIncident = primary != null
                ? nearestIncidentNearRoute(primary.points, activeIncidents)
                : null;

        boolean isRerouteNeeded = corridorIncident != null || Boolean.TRUE.equals(request.getAvoidHazardZones());

        RouteResponseDto.RouteResponseDtoBuilder response = RouteResponseDto.builder()
                .vehicleCode(request.getVehicleCode() != null ? request.getVehicleCode() : "NER-07")
                .isRerouteRecommended(isRerouteNeeded)
                .affectedIncidentsCount(activeIncidents.size());

        if (primary != null) {
            response.primaryDistanceKm(primary.distanceKm)
                    .primaryEtaMinutes(primary.etaMinutes)
                    .primaryWaypoints(toWaypoints(primary.points))
                    .primaryRiskLevel(corridorIncident != null ? "CRITICAL" : "LOW");
        } else {
            response.primaryRiskLevel("UNKNOWN");
            log.warn("GraphHopper unreachable at {} -- primary route left uncalculated (never fabricated).", graphHopperUrl);
        }

        if (isRerouteNeeded) {
            GraphHopperRoute alternative = corridorIncident != null
                    ? queryGraphHopperAvoiding(originLat, originLng, destLat, destLng,
                        corridorIncident.getLatitude(), corridorIncident.getLongitude())
                    : queryGraphHopper(originLat, originLng, destLat, destLng);

            if (alternative != null) {
                Integer delayMinutes = primary != null
                        ? Math.max(0, alternative.etaMinutes - primary.etaMinutes)
                        : null;
                response.alternativeDistanceKm(alternative.distanceKm)
                        .alternativeEtaMinutes(alternative.etaMinutes)
                        .alternativeWaypoints(toWaypoints(alternative.points))
                        .alternativeRiskLevel("LOW")
                        .recommendationAction("REROUTE")
                        .riskReduction(primary != null ? "HIGH" : "UNKNOWN")
                        .estimatedDelayMinutes(delayMinutes)
                        .rerouteReason(corridorIncident != null
                                ? String.format(Locale.ROOT,
                                    "Active %s incident detected within %.0fkm of the primary corridor near %s.",
                                    corridorIncident.getType(), INCIDENT_PROXIMITY_METERS / 1000.0,
                                    corridorIncident.getLocationName() != null ? corridorIncident.getLocationName() : "the route")
                                : "Hazard-zone avoidance requested by operator.");
            } else {
                response.recommendationAction("REROUTE")
                        .rerouteReason("Reroute recommended, but a GraphHopper alternative could not be computed "
                                + "(routing engine unreachable at " + graphHopperUrl + ").");
            }
        } else {
            response.recommendationAction("PROCEED_PRIMARY")
                    .riskReduction("NONE")
                    .estimatedDelayMinutes(0)
                    .rerouteReason(primary != null
                            ? "Primary corridor is clear of active incidents."
                            : "Primary corridor status unknown -- GraphHopper routing engine unreachable.");
        }

        return response.build();
    }

    public RouteResponseDto rerouteVehicle(String vehicleCode) {
        // No fixed "current position" is known for an arbitrary vehicle from this
        // isolated service (that lives in Vehicle/telematics data) -- this endpoint
        // is legacy/orphaned (see class javadoc); kept functional using the same
        // sample corridor previously hardcoded here, but the fabricated distance/
        // ETA numbers are gone and it goes through the same real GraphHopper path.
        RouteRequestDto dto = RouteRequestDto.builder()
                .vehicleCode(vehicleCode)
                .originLat(25.1234)
                .originLng(92.5678)
                .destLat(24.8333)
                .destLng(92.7789)
                .avoidHazardZones(true)
                .build();

        RouteResponseDto response = calculateRoute(dto);
        log.info("Rerouting Service: computed bypass route for vehicle {} (graphhopper reachable={})",
                vehicleCode, response.getPrimaryDistanceKm() != null);

        messagingTemplate.convertAndSend("/topic/route-updates", response);
        return response;
    }

    // -------------------------------------------------------------------
    // Real GraphHopper HTTP client -- returns null (never a fabricated
    // route) if the engine can't be reached or returns no usable path.
    // -------------------------------------------------------------------

    private GraphHopperRoute queryGraphHopper(double originLat, double originLng, double destLat, double destLng) {
        String url = String.format(Locale.ROOT,
                "%s/route?point=%f,%f&point=%f,%f&profile=car&points_encoded=false",
                graphHopperUrl, originLat, originLng, destLat, destLng);
        return executeGraphHopperRequest(url);
    }

    private GraphHopperRoute queryGraphHopperAvoiding(double originLat, double originLng, double destLat, double destLng,
                                                       Double avoidLat, Double avoidLng) {
        if (avoidLat == null || avoidLng == null) {
            return queryGraphHopper(originLat, originLng, destLat, destLng);
        }
        double delta = 0.15;
        String body = String.format(Locale.ROOT, """
                {
                  "points": [[%f,%f],[%f,%f]],
                  "profile": "car",
                  "points_encoded": false,
                  "ch.disable": true,
                  "custom_model": {
                    "areas": {
                      "type": "FeatureCollection",
                      "features": [{
                        "type": "Feature",
                        "id": "avoid_incident_zone",
                        "geometry": {
                          "type": "Polygon",
                          "coordinates": [[[%f,%f],[%f,%f],[%f,%f],[%f,%f],[%f,%f]]]
                        }
                      }]
                    },
                    "priority": [{"if": "in_avoid_incident_zone", "multiply_by": 0.0}]
                  }
                }
                """,
                originLng, originLat, destLng, destLat,
                avoidLng - delta, avoidLat - delta, avoidLng + delta, avoidLat - delta,
                avoidLng + delta, avoidLat + delta, avoidLng - delta, avoidLat + delta,
                avoidLng - delta, avoidLat - delta);

        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(graphHopperUrl + "/route"))
                    .timeout(Duration.ofSeconds(4))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                log.warn("GraphHopper avoid-zone request failed with HTTP {}", res.statusCode());
                return null;
            }
            return parseGraphHopperResponse(res.body());
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("GraphHopper avoid-zone request failed: {}", e.getMessage());
            return null;
        }
    }

    private GraphHopperRoute executeGraphHopperRequest(String url) {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(4))
                    .GET()
                    .build();
            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                log.warn("GraphHopper request failed with HTTP {}", res.statusCode());
                return null;
            }
            return parseGraphHopperResponse(res.body());
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("GraphHopper request failed: {}", e.getMessage());
            return null;
        }
    }

    private GraphHopperRoute parseGraphHopperResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode paths = root.path("paths");
            if (!paths.isArray() || paths.isEmpty()) {
                return null;
            }
            JsonNode path = paths.get(0);
            double distanceKm = path.path("distance").asDouble(0.0) / 1000.0;
            int etaMinutes = (int) Math.round(path.path("time").asLong(0L) / 60000.0);

            List<double[]> points = new ArrayList<>();
            JsonNode coords = path.path("points").path("coordinates");
            if (coords.isArray()) {
                for (JsonNode c : coords) {
                    if (c.isArray() && c.size() >= 2) {
                        points.add(new double[]{c.get(1).asDouble(), c.get(0).asDouble()}); // [lat, lon]
                    }
                }
            }
            return new GraphHopperRoute(Math.round(distanceKm * 10.0) / 10.0, etaMinutes, points);
        } catch (IOException e) {
            log.warn("Failed to parse GraphHopper response: {}", e.getMessage());
            return null;
        }
    }

    private Incident nearestIncidentNearRoute(List<double[]> routePoints, List<Incident> activeIncidents) {
        if (routePoints.isEmpty() || activeIncidents.isEmpty()) {
            return null;
        }
        // Sample along the route (real GraphHopper polylines can have thousands
        // of points) and use the existing PostGIS ST_DWithin query per sample --
        // reuses the project's real GIS infrastructure instead of hand-rolled
        // distance math.
        int step = Math.max(1, routePoints.size() / 40);
        for (int i = 0; i < routePoints.size(); i += step) {
            double[] p = routePoints.get(i);
            List<Incident> nearby = incidentRepository.findIncidentsNearLocation(p[0], p[1], INCIDENT_PROXIMITY_METERS);
            for (Incident incident : nearby) {
                if (activeIncidents.contains(incident)) {
                    return incident;
                }
            }
        }
        return null;
    }

    private List<RoutePoint> toWaypoints(List<double[]> points) {
        List<RoutePoint> waypoints = new ArrayList<>();
        if (points.isEmpty()) {
            return waypoints;
        }
        // Real GraphHopper polylines can carry thousands of points; downsample
        // for map rendering the same way the Python client does, rather than
        // shipping every raw coordinate.
        int maxPoints = 150;
        int step = Math.max(1, points.size() / maxPoints);
        for (int i = 0; i < points.size(); i += step) {
            double[] p = points.get(i);
            waypoints.add(RoutePoint.builder().lat(p[0]).lng(p[1]).build());
        }
        double[] last = points.get(points.size() - 1);
        double[] lastAdded = waypoints.isEmpty() ? null : new double[]{waypoints.get(waypoints.size() - 1).getLat(), waypoints.get(waypoints.size() - 1).getLng()};
        if (lastAdded == null || lastAdded[0] != last[0] || lastAdded[1] != last[1]) {
            waypoints.add(RoutePoint.builder().lat(last[0]).lng(last[1]).build());
        }
        return waypoints;
    }

    private record GraphHopperRoute(double distanceKm, int etaMinutes, List<double[]> points) {
    }
}
