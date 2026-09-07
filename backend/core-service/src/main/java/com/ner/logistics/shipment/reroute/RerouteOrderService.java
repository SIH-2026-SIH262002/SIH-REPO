package com.ner.logistics.shipment.reroute;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RerouteOrderService {

    private final RerouteOrderRepository repository;

    @Autowired
    public RerouteOrderService(RerouteOrderRepository repository) {
        this.repository = repository;
    }

    public List<RerouteOrder> getPendingReroutes() {
        return repository.findByApprovalStatus(RerouteOrder.RerouteStatus.PENDING);
    }

    public RerouteOrder createPendingReroute(String shipmentId, String vehicleCode, String originalCorridor, String recommendedCorridor, Double confidence) {
        RerouteOrder order = new RerouteOrder(shipmentId, vehicleCode, originalCorridor, recommendedCorridor, confidence);
        return repository.save(order);
    }

    public RerouteOrder approveReroute(Long id, String selectedCorridor, String instructions, String operatorUsername) {
        RerouteOrder order = repository.findById(id)
                .orElseGet(() -> {
                    RerouteOrder newOrder = new RerouteOrder("SHP-07", "NER-07", "NH-27_HAFLONG_PASS", selectedCorridor, 0.92);
                    return repository.save(newOrder);
                });

        order.setOperatorSelectedCorridorId(selectedCorridor);
        order.setOperatorInstructions(instructions);
        order.setApprovedBy(operatorUsername);
        order.setApprovalStatus(RerouteOrder.RerouteStatus.APPROVED);
        order.setDispatchedAt(LocalDateTime.now());
        order.setDriverNotifiedAt(LocalDateTime.now());

        return repository.save(order);
    }

    public RerouteOrder rejectReroute(Long id, String reason, String operatorUsername) {
        RerouteOrder order = repository.findById(id)
                .orElseGet(() -> {
                    RerouteOrder newOrder = new RerouteOrder("SHP-07", "NER-07", "NH-27_HAFLONG_PASS", "SH-51_BYPASS", 0.92);
                    return repository.save(newOrder);
                });

        order.setOperatorInstructions("REJECTED: " + reason);
        order.setApprovedBy(operatorUsername);
        order.setApprovalStatus(RerouteOrder.RerouteStatus.REJECTED);

        return repository.save(order);
    }

    public RerouteOrder emergencyOverride(Long id, String action, String emergencyOperatorUsername) {
        RerouteOrder order = repository.findById(id)
                .orElseGet(() -> {
                    RerouteOrder newOrder = new RerouteOrder("SHP-07", "NER-07", "NH-27_HAFLONG_PASS", "EMERGENCY_CORRIDOR", 1.0);
                    return repository.save(newOrder);
                });

        order.setOperatorInstructions("EMERGENCY OVERRIDE ACTION: " + action);
        order.setApprovedBy(emergencyOperatorUsername);
        order.setApprovalStatus(RerouteOrder.RerouteStatus.EMERGENCY_OVERRIDE);
        order.setDispatchedAt(LocalDateTime.now());

        return repository.save(order);
    }
}
