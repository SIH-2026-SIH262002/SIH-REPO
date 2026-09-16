package com.ner.logistics.handover;

import com.ner.logistics.assistance.AssistanceRequest;
import com.ner.logistics.assistance.AssistanceRequestRepository;
import com.ner.logistics.driver.DriverProfile;
import com.ner.logistics.driver.DriverProfileRepository;
import com.ner.logistics.routing.GraphHopperRoutingService;
import com.ner.logistics.routing.RouteRequestDto;
import com.ner.logistics.routing.RouteResponseDto;
import com.ner.logistics.shipment.Shipment;
import com.ner.logistics.shipment.ShipmentRepository;
import com.ner.logistics.vehicle.Vehicle;
import com.ner.logistics.vehicle.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
public class TripHandoverService {

    private final TripHandoverRepository tripHandoverRepository;
    private final AssistanceRequestRepository assistanceRequestRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final VehicleRepository vehicleRepository;
    private final ShipmentRepository shipmentRepository;
    private final GraphHopperRoutingService routingService;

    private final AtomicLong handoverCounter = new AtomicLong(System.currentTimeMillis() % 10000);

    public List<TripHandover> getAllHandovers() {
        return tripHandoverRepository.findAll();
    }

    public List<TripHandover> getActiveHandovers() {
        return tripHandoverRepository.findByStatusNot("COMPLETED").stream()
                .filter(h -> !"CANCELLED".equals(h.getStatus()) && !"REJECTED".equals(h.getStatus()))
                .toList();
    }

    public TripHandover getHandoverById(Long id) {
        return tripHandoverRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trip handover not found with ID: " + id));
    }

    @Transactional
    public TripHandover initiateHandover(TripHandoverDto dto, String operatorUsername) {
        Shipment shipment = shipmentRepository.findById(dto.getShipmentId())
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found with ID: " + dto.getShipmentId()));

        String vehicleCode = dto.getVehicleCode() != null ? dto.getVehicleCode() : shipment.getVehicleCode();
        Vehicle vehicle = vehicleRepository.findByCode(vehicleCode)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found with code: " + vehicleCode));

        DriverProfile originalDriver;
        if (dto.getOriginalDriverId() != null) {
            originalDriver = driverProfileRepository.findById(dto.getOriginalDriverId())
                    .orElseThrow(() -> new IllegalArgumentException("Original driver not found with ID: " + dto.getOriginalDriverId()));
        } else if (shipment.getAssignedDriverUsername() != null) {
            originalDriver = driverProfileRepository.findByUserUsername(shipment.getAssignedDriverUsername())
                    .orElseThrow(() -> new IllegalArgumentException("Driver profile not found for assigned driver: " + shipment.getAssignedDriverUsername()));
        } else {
            throw new IllegalArgumentException("Cannot identify original driver for shipment #" + shipment.getId());
        }

        // Determine Handover Location
        String locationType = dto.getHandoverLocationType() != null ? dto.getHandoverLocationType() : "CURRENT_VEHICLE_LOCATION";
        Double lat = dto.getHandoverLatitude();
        Double lng = dto.getHandoverLongitude();
        String locName = dto.getHandoverLocationName();

        if (lat == null || lng == null) {
            if ("SAFE_HANDOVER_POINT".equalsIgnoreCase(locationType)) {
                // Default designated safe waystation in Central NER (Haflong Mountain Bypass Safe Staging Depot)
                lat = 25.1667;
                lng = 93.0167;
                locName = locName != null ? locName : "Haflong Safe Transit Staging Point";
            } else {
                lat = originalDriver.getCurrentLatitude() != null ? originalDriver.getCurrentLatitude() : 25.1500;
                lng = originalDriver.getCurrentLongitude() != null ? originalDriver.getCurrentLongitude() : 92.7000;
                locName = locName != null ? locName : "Current Vehicle Location (" + vehicleCode + ")";
            }
        }

        String hndNum = String.format("HND-%d-%04d", LocalDateTime.now().getYear(), handoverCounter.incrementAndGet() % 10000);

        TripHandover handover = TripHandover.builder()
                .handoverNumber(hndNum)
                .assistanceRequestId(dto.getAssistanceRequestId())
                .shipmentId(shipment.getId())
                .vehicleCode(vehicleCode)
                .originalDriver(originalDriver)
                .handoverLocationType(locationType)
                .handoverLatitude(lat)
                .handoverLongitude(lng)
                .handoverLocationName(locName)
                .status("PENDING_REPLACEMENT")
                .handoverNotes(dto.getHandoverNotes())
                .initiatedBy(operatorUsername)
                .build();

        originalDriver.setOperationalStatus("HANDOVER_REQUIRED");
        driverProfileRepository.save(originalDriver);

        TripHandover saved = tripHandoverRepository.save(handover);
        log.info("Trip handover #{} ({}) initiated for shipment #{} / vehicle {}",
                saved.getId(), hndNum, shipment.getId(), vehicleCode);
        return saved;
    }

    /**
     * Candidate Replacement Driver Ranking
     * Filter available -> Haversine preliminary radius -> Real GraphHopper road ETA -> Corridor risk weighting -> Rank
     */
    public List<CandidateDriverDto> getCandidateDrivers(Long handoverId) {
        TripHandover handover = getHandoverById(handoverId);
        Double destLat = handover.getHandoverLatitude();
        Double destLng = handover.getHandoverLongitude();

        List<DriverProfile> allEligible = driverProfileRepository.findByOperationalStatusAndFitnessStatus("ACTIVE", "FIT");
        List<CandidateDriverDto> ranked = new ArrayList<>();

        for (DriverProfile candidate : allEligible) {
            // Exclude original driver or driver with an ongoing active trip
            if (candidate.getId().equals(handover.getOriginalDriver().getId()) || candidate.getActiveShipmentId() != null) {
                continue;
            }

            Double candLat = candidate.getCurrentLatitude();
            Double candLng = candidate.getCurrentLongitude();

            // If coordinates not set, infer approximate coordinates from known base depots
            if (candLat == null || candLng == null) {
                candLat = getDepotLatitude(candidate.getBaseDepot());
                candLng = getDepotLongitude(candidate.getBaseDepot());
            }

            // Preliminary Haversine filter (within 160km)
            double directDistKm = calculateHaversineDistanceKm(candLat, candLng, destLat, destLng);
            if (directDistKm > 160.0) {
                continue;
            }

            // Real Route Query via GraphHopper
            Double roadDistanceKm = null;
            Integer etaMinutes = null;
            String riskLevel = "LOW";
            boolean isFallback = false;

            try {
                RouteRequestDto routeReq = RouteRequestDto.builder()
                        .originLat(candLat)
                        .originLng(candLng)
                        .destLat(destLat)
                        .destLng(destLng)
                        .vehicleCode(handover.getVehicleCode())
                        .avoidHazardZones(true)
                        .build();

                RouteResponseDto routeResp = routingService.calculateRoute(routeReq);
                if (routeResp != null && routeResp.getPrimaryDistanceKm() != null && routeResp.getPrimaryDistanceKm() > 0) {
                    roadDistanceKm = routeResp.getPrimaryDistanceKm();
                    etaMinutes = routeResp.getPrimaryEtaMinutes();
                    riskLevel = routeResp.getPrimaryRiskLevel() != null ? routeResp.getPrimaryRiskLevel() : "LOW";
                }
            } catch (Exception ex) {
                log.warn("Routing service query failed for candidate #{}: {}", candidate.getId(), ex.getMessage());
            }

            if (roadDistanceKm == null) {
                // Transparent fallback without inventing fake ETA
                roadDistanceKm = directDistKm;
                isFallback = true;
                riskLevel = "UNKNOWN";
            }

            // Composite score: etaMinutes + riskPenalty (lower score = higher rank)
            double riskPenalty = "CRITICAL".equalsIgnoreCase(riskLevel) ? 60.0 :
                    "HIGH".equalsIgnoreCase(riskLevel) ? 30.0 :
                    "MODERATE".equalsIgnoreCase(riskLevel) ? 15.0 : 0.0;

            double composite = (etaMinutes != null ? etaMinutes : (directDistKm * 2.0)) + riskPenalty;

            ranked.add(CandidateDriverDto.builder()
                    .driverId(candidate.getId())
                    .username(candidate.getUser().getUsername())
                    .fullName(candidate.getUser().getFullName())
                    .phoneNumber(candidate.getUser().getPhoneNumber())
                    .licenseNumber(candidate.getLicenseNumber())
                    .licenseCategory(candidate.getLicenseCategory())
                    .baseDepot(candidate.getBaseDepot())
                    .currentLatitude(candLat)
                    .currentLongitude(candLng)
                    .distanceKm(Math.round(roadDistanceKm * 10.0) / 10.0)
                    .etaMinutes(etaMinutes)
                    .riskLevel(riskLevel)
                    .compositeScore(Math.round(composite * 10.0) / 10.0)
                    .isFallbackEstimate(isFallback)
                    .build());
        }

        ranked.sort(Comparator.comparingDouble(CandidateDriverDto::getCompositeScore));
        return ranked;
    }

    @Transactional
    public TripHandover assignReplacementDriver(Long handoverId, Long replacementDriverId, String operatorUsername) {
        TripHandover handover = getHandoverById(handoverId);
        DriverProfile replacement = driverProfileRepository.findById(replacementDriverId)
                .orElseThrow(() -> new IllegalArgumentException("Replacement driver not found with ID: " + replacementDriverId));

        if (!"FIT".equalsIgnoreCase(replacement.getFitnessStatus())) {
            throw new IllegalStateException("Selected driver is not marked FIT for duty");
        }

        handover.setReplacementDriver(replacement);
        handover.setStatus("REPLACEMENT_OFFERED");

        // Query real route for arrival metrics
        Double candLat = replacement.getCurrentLatitude() != null ? replacement.getCurrentLatitude() : getDepotLatitude(replacement.getBaseDepot());
        Double candLng = replacement.getCurrentLongitude() != null ? replacement.getCurrentLongitude() : getDepotLongitude(replacement.getBaseDepot());

        try {
            RouteRequestDto routeReq = RouteRequestDto.builder()
                    .originLat(candLat)
                    .originLng(candLng)
                    .destLat(handover.getHandoverLatitude())
                    .destLng(handover.getHandoverLongitude())
                    .vehicleCode(handover.getVehicleCode())
                    .avoidHazardZones(true)
                    .build();

            RouteResponseDto routeResp = routingService.calculateRoute(routeReq);
            if (routeResp != null && routeResp.getPrimaryDistanceKm() != null) {
                handover.setEstimatedDistanceKm(routeResp.getPrimaryDistanceKm());
                handover.setEstimatedArrivalMinutes(routeResp.getPrimaryEtaMinutes());
                handover.setIsFallbackEstimate(false);
            }
        } catch (Exception ex) {
            log.warn("Routing lookup for handover assignment failed: {}", ex.getMessage());
            handover.setIsFallbackEstimate(true);
        }

        log.info("Handover #{} assigned replacement driver {} by {}",
                handoverId, replacement.getUser().getUsername(), operatorUsername);
        return tripHandoverRepository.save(handover);
    }

    @Transactional
    public TripHandover acceptHandover(Long handoverId, String driverUsername) {
        TripHandover handover = getHandoverById(handoverId);
        if (handover.getReplacementDriver() == null) {
            throw new IllegalStateException("No replacement driver has been assigned to this handover");
        }

        if (!handover.getReplacementDriver().getUser().getUsername().equalsIgnoreCase(driverUsername)) {
            throw new AccessDeniedException("Access Denied: Only the designated replacement driver can accept this handover assignment");
        }

        handover.setStatus("ACCEPTED");
        log.info("Handover #{} accepted by driver {}", handoverId, driverUsername);
        return tripHandoverRepository.save(handover);
    }

    @Transactional
    public TripHandover rejectHandover(Long handoverId, String reason, String driverUsername) {
        TripHandover handover = getHandoverById(handoverId);
        if (handover.getReplacementDriver() == null) {
            throw new IllegalStateException("No replacement driver assigned");
        }

        if (!handover.getReplacementDriver().getUser().getUsername().equalsIgnoreCase(driverUsername)) {
            throw new AccessDeniedException("Access Denied: Only the designated replacement driver can reject this handover assignment");
        }

        handover.setStatus("PENDING_REPLACEMENT");
        handover.setReplacementDriver(null);
        handover.setHandoverNotes("Rejected by " + driverUsername + ": " + (reason != null ? reason : "No reason provided"));
        log.warn("Handover #{} rejected by driver {}", handoverId, driverUsername);
        return tripHandoverRepository.save(handover);
    }

    /**
     * ATOMIC / TRANSACTIONAL Handover Completion (Correction #4):
     * Updates TripHandover, Vehicle, Shipment, Original Driver, and Replacement Driver in a single transaction.
     */
    @Transactional(rollbackFor = Exception.class)
    public TripHandover completeHandover(Long handoverId, HandoverChecklistDto checklist, String operatorUsername) {
        TripHandover handover = getHandoverById(handoverId);

        if (handover.getReplacementDriver() == null) {
            throw new IllegalStateException("Cannot complete handover without an assigned replacement driver");
        }

        if (!checklist.isCargoSealVerified() || !checklist.isKeysTransferred() || !checklist.isVehicleInspectionPassed()) {
            throw new IllegalArgumentException("All handover checklist items (cargo seal, keys transferred, vehicle inspection) must be verified before completing the transfer.");
        }

        // 1. Update Handover entity
        handover.setStatus("COMPLETED");
        handover.setCargoSealVerified(true);
        handover.setKeysTransferred(true);
        handover.setVehicleInspectionPassed(true);
        if (checklist.getNotes() != null && !checklist.getNotes().isBlank()) {
            handover.setHandoverNotes(checklist.getNotes());
        }
        handover.setCompletedAt(LocalDateTime.now());
        tripHandoverRepository.save(handover);

        // 2. Update Vehicle entity atomically
        Vehicle vehicle = vehicleRepository.findByCode(handover.getVehicleCode())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + handover.getVehicleCode()));
        vehicle.setAssignedDriverUsername(handover.getReplacementDriver().getUser().getUsername());
        vehicle.setDriverId(handover.getReplacementDriver().getId());
        vehicle.setStatus("ON_TRACK");
        vehicleRepository.save(vehicle);

        // 3. Update Shipment entity atomically
        Shipment shipment = shipmentRepository.findById(handover.getShipmentId())
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found: " + handover.getShipmentId()));
        shipment.setAssignedDriverUsername(handover.getReplacementDriver().getUser().getUsername());
        shipment.setStatus("IN_TRANSIT");
        shipmentRepository.save(shipment);

        // 4. Update Original Driver status atomically
        DriverProfile original = handover.getOriginalDriver();
        original.setOperationalStatus("OFF_DUTY");
        original.setAssignedVehicleCode(null);
        original.setActiveShipmentId(null);
        driverProfileRepository.save(original);

        // 5. Update Replacement Driver status atomically
        DriverProfile replacement = handover.getReplacementDriver();
        replacement.setOperationalStatus("ON_TRIP");
        replacement.setAssignedVehicleCode(vehicle.getCode());
        replacement.setActiveShipmentId(shipment.getId());
        driverProfileRepository.save(replacement);

        // 6. If originating from an AssistanceRequest, resolve it atomically
        if (handover.getAssistanceRequestId() != null) {
            assistanceRequestRepository.findById(handover.getAssistanceRequestId()).ifPresent(req -> {
                req.setStatus("RESOLVED");
                req.setResolvedBy(operatorUsername);
                req.setResolvedAt(LocalDateTime.now());
                req.setResolutionNotes("Trip handover successfully executed. Trip resumed by driver " + replacement.getUser().getUsername());
                assistanceRequestRepository.save(req);
            });
        }

        log.info("✅ ATOMIC HANDOVER #{} COMPLETED: Vehicle {} & Shipment #{} transferred from {} to {}. Delivery resumed.",
                handoverId, vehicle.getCode(), shipment.getId(), original.getUser().getUsername(), replacement.getUser().getUsername());

        return handover;
    }

    private double calculateHaversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double p = 0.017453292519943295; // Math.PI / 180
        double a = 0.5 - Math.cos((lat2 - lat1) * p) / 2 +
                Math.cos(lat1 * p) * Math.cos(lat2 * p) *
                        (1 - Math.cos((lon2 - lon1) * p)) / 2;
        return 12742.0 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
    }

    private double getDepotLatitude(String depotName) {
        if (depotName == null) return 26.1445; // Guwahati
        String d = depotName.toLowerCase();
        if (d.contains("silchar")) return 24.8333;
        if (d.contains("haflong")) return 25.1667;
        if (d.contains("shillong")) return 25.5788;
        if (d.contains("jatinga")) return 25.1200;
        return 26.1445; // Default Guwahati
    }

    private double getDepotLongitude(String depotName) {
        if (depotName == null) return 91.7362;
        String d = depotName.toLowerCase();
        if (d.contains("silchar")) return 92.7789;
        if (d.contains("haflong")) return 93.0167;
        if (d.contains("shillong")) return 91.8933;
        if (d.contains("jatinga")) return 92.8900;
        return 91.7362;
    }
}
