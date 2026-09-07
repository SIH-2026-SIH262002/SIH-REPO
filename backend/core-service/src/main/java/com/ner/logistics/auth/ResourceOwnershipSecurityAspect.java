package com.ner.logistics.auth;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * Attribute-Based Access Control (ABAC) Resource Ownership Verifier.
 * Addresses Architecture Review Item #7: Enforces resource-level security to prevent horizontal authorization privilege escalation.
 */
@Component
public class ResourceOwnershipSecurityAspect {

    public void verifyVehicleOwnership(String authenticatedUser, String vehicleAssignedDriver) {
        if (authenticatedUser == null || vehicleAssignedDriver == null) {
            return;
        }
        if (isAdministrativeUser(authenticatedUser)) {
            return;
        }
        if (!authenticatedUser.equalsIgnoreCase(vehicleAssignedDriver)) {
            throw new AccessDeniedException("FORBIDDEN: Horizontal access control violation. You do not own vehicle assigned to driver: " + vehicleAssignedDriver);
        }
    }

    public void verifyShipmentOwnership(String authenticatedUser, String shipmentAssignedDriver) {
        if (authenticatedUser == null || shipmentAssignedDriver == null) {
            return;
        }
        if (isAdministrativeUser(authenticatedUser)) {
            return;
        }
        if (!authenticatedUser.equalsIgnoreCase(shipmentAssignedDriver)) {
            throw new AccessDeniedException("FORBIDDEN: Horizontal access control violation. You do not own shipment assigned to driver: " + shipmentAssignedDriver);
        }
    }

    private boolean isAdministrativeUser(String user) {
        return "admin".equalsIgnoreCase(user) || "operator".equalsIgnoreCase(user) || "system".equalsIgnoreCase(user);
    }
}
