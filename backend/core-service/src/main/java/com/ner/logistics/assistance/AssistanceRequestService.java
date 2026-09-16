package com.ner.logistics.assistance;

import com.ner.logistics.driver.DriverProfile;
import com.ner.logistics.driver.DriverProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssistanceRequestService {

    private final AssistanceRequestRepository assistanceRequestRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final AtomicLong requestCounter = new AtomicLong(System.currentTimeMillis() % 10000);

    public List<AssistanceRequest> getAllRequests() {
        return assistanceRequestRepository.findAll();
    }

    public List<AssistanceRequest> getActiveRequests() {
        return assistanceRequestRepository.findByStatusNot("RESOLVED").stream()
                .filter(r -> !"CANCELLED".equals(r.getStatus()))
                .toList();
    }

    public AssistanceRequest getRequestById(Long id) {
        return assistanceRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Assistance request not found with ID: " + id));
    }

    @Transactional
    public AssistanceRequest createRequest(AssistanceRequestDto dto, String callerUsername) {
        DriverProfile driver;
        if (dto.getDriverId() != null) {
            driver = driverProfileRepository.findById(dto.getDriverId())
                    .orElseThrow(() -> new IllegalArgumentException("Driver profile not found with ID: " + dto.getDriverId()));
        } else if (callerUsername != null) {
            driver = driverProfileRepository.findByUserUsername(callerUsername)
                    .orElseThrow(() -> new IllegalArgumentException("Driver profile not found for authenticated user: " + callerUsername));
        } else {
            throw new IllegalArgumentException("Either driverId or authenticated driver context is required");
        }

        String vehicleCode = dto.getVehicleCode() != null ? dto.getVehicleCode() : driver.getAssignedVehicleCode();
        Long shipmentId = dto.getShipmentId() != null ? dto.getShipmentId() : driver.getActiveShipmentId();

        Double lat = dto.getLatitude() != null ? dto.getLatitude() : driver.getCurrentLatitude();
        Double lng = dto.getLongitude() != null ? dto.getLongitude() : driver.getCurrentLongitude();

        String reqNum = String.format("AST-%d-%04d", LocalDateTime.now().getYear(), requestCounter.incrementAndGet() % 10000);

        AssistanceRequest request = AssistanceRequest.builder()
                .requestNumber(reqNum)
                .driver(driver)
                .vehicleCode(vehicleCode)
                .shipmentId(shipmentId)
                .sosEventId(dto.getSosEventId())
                .category(dto.getCategory())
                .severity(dto.getSeverity())
                .status("OPEN")
                .latitude(lat)
                .longitude(lng)
                .locationDescription(dto.getLocationDescription())
                .operationalNotes(dto.getOperationalNotes())
                .build();

        // If driver flags unable to continue, update driver operational status
        if ("UNABLE_TO_CONTINUE".equalsIgnoreCase(dto.getCategory()) || "MEDICAL_EMERGENCY".equalsIgnoreCase(dto.getCategory())) {
            driver.setFitnessStatus("UNABLE_TO_CONTINUE");
            driver.setOperationalStatus("HANDOVER_REQUIRED");
            driverProfileRepository.save(driver);
            log.warn("⚠️ Driver #{} flagged UNABLE_TO_CONTINUE via assistance request {}", driver.getId(), reqNum);
        }

        AssistanceRequest saved = assistanceRequestRepository.save(request);
        log.info("Assistance request #{} ({}) created for driver {} / vehicle {}",
                saved.getId(), reqNum, driver.getUser().getUsername(), vehicleCode);
        return saved;
    }

    @Transactional
    public AssistanceRequest acknowledgeRequest(Long id, String operatorUsername) {
        AssistanceRequest request = getRequestById(id);
        if (!"OPEN".equalsIgnoreCase(request.getStatus())) {
            throw new IllegalStateException("Only OPEN assistance requests can be acknowledged. Current status: " + request.getStatus());
        }

        request.setStatus("ACKNOWLEDGED");
        request.setAcknowledgedBy(operatorUsername);
        request.setAcknowledgedAt(LocalDateTime.now());
        return assistanceRequestRepository.save(request);
    }

    @Transactional
    public AssistanceRequest dispatchAssistance(Long id, String dispatchedAction, String operatorUsername) {
        AssistanceRequest request = getRequestById(id);
        if ("RESOLVED".equalsIgnoreCase(request.getStatus()) || "CANCELLED".equalsIgnoreCase(request.getStatus())) {
            throw new IllegalStateException("Cannot dispatch assistance for request in status: " + request.getStatus());
        }

        request.setStatus("ASSISTANCE_DISPATCHED");
        request.setDispatchedAction(dispatchedAction);
        if (request.getAcknowledgedBy() == null) {
            request.setAcknowledgedBy(operatorUsername);
            request.setAcknowledgedAt(LocalDateTime.now());
        }
        return assistanceRequestRepository.save(request);
    }

    /**
     * Cancellation Rule Enforcement (Correction #6):
     * OPEN -> CANCELLED: Permitted by driver or operator
     * After dispatch (ACKNOWLEDGED or ASSISTANCE_DISPATCHED): Permitted ONLY by authorized operator/admin with mandatory reason
     */
    @Transactional
    public AssistanceRequest cancelRequest(Long id, String reason, String callerUsername, boolean isOperatorOrAdmin) {
        AssistanceRequest request = getRequestById(id);

        if ("RESOLVED".equalsIgnoreCase(request.getStatus()) || "CANCELLED".equalsIgnoreCase(request.getStatus())) {
            throw new IllegalStateException("Assistance request is already finalized with status: " + request.getStatus());
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Cancellation reason is required");
        }

        if ("OPEN".equalsIgnoreCase(request.getStatus())) {
            // Driver or Operator can cancel when OPEN
            boolean isDriverOwner = callerUsername != null &&
                    callerUsername.equalsIgnoreCase(request.getDriver().getUser().getUsername());
            if (!isDriverOwner && !isOperatorOrAdmin) {
                throw new AccessDeniedException("Access Denied: You cannot cancel another driver's assistance request");
            }
        } else {
            // Post-dispatch or acknowledged requires authorized operator action
            if (!isOperatorOrAdmin) {
                throw new AccessDeniedException("Access Denied: After assistance is acknowledged/dispatched, only an authorized Logistics Operator can cancel with operational justification.");
            }
        }

        request.setStatus("CANCELLED");
        request.setCancelledBy(callerUsername);
        request.setCancelledAt(LocalDateTime.now());
        request.setCancellationNotes(reason);

        // If driver was flagged HANDOVER_REQUIRED, check if can revert to ACTIVE if no other active issues
        DriverProfile driver = request.getDriver();
        if ("HANDOVER_REQUIRED".equals(driver.getOperationalStatus())) {
            driver.setOperationalStatus("ACTIVE");
            driver.setFitnessStatus("FIT");
            driverProfileRepository.save(driver);
        }

        log.info("Assistance request #{} CANCELLED by {} with reason: {}", id, callerUsername, reason);
        return assistanceRequestRepository.save(request);
    }

    @Transactional
    public AssistanceRequest resolveRequest(Long id, String resolutionNotes, String operatorUsername) {
        AssistanceRequest request = getRequestById(id);
        if ("CANCELLED".equalsIgnoreCase(request.getStatus())) {
            throw new IllegalStateException("Cannot resolve a cancelled assistance request");
        }

        request.setStatus("RESOLVED");
        request.setResolvedBy(operatorUsername);
        request.setResolvedAt(LocalDateTime.now());
        request.setResolutionNotes(resolutionNotes != null ? resolutionNotes : "Assistance successfully coordinated and resolved.");
        return assistanceRequestRepository.save(request);
    }
}
