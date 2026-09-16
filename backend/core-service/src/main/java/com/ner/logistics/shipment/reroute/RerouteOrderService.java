package com.ner.logistics.shipment.reroute;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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

    public Optional<RerouteOrder> approveReroute(Long id, String selectedCorridor, String instructions, String operatorUsername) {
        return repository.findById(id).map(order -> {
            order.setOperatorSelectedCorridorId(selectedCorridor);
            order.setOperatorInstructions(instructions);
            order.setApprovedBy(operatorUsername);
            order.setApprovalStatus(RerouteOrder.RerouteStatus.APPROVED);
            order.setDispatchedAt(LocalDateTime.now());
            order.setDriverNotifiedAt(LocalDateTime.now());
            return repository.save(order);
        });
    }

    public Optional<RerouteOrder> rejectReroute(Long id, String reason, String operatorUsername) {
        return repository.findById(id).map(order -> {
            order.setOperatorInstructions("REJECTED: " + reason);
            order.setApprovedBy(operatorUsername);
            order.setApprovalStatus(RerouteOrder.RerouteStatus.REJECTED);
            return repository.save(order);
        });
    }

    public Optional<RerouteOrder> emergencyOverride(Long id, String action, String emergencyOperatorUsername) {
        return repository.findById(id).map(order -> {
            order.setOperatorInstructions("EMERGENCY OVERRIDE ACTION: " + action);
            order.setApprovedBy(emergencyOperatorUsername);
            order.setApprovalStatus(RerouteOrder.RerouteStatus.EMERGENCY_OVERRIDE);
            order.setDispatchedAt(LocalDateTime.now());
            return repository.save(order);
        });
    }
}
