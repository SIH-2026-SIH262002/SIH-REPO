package com.ner.logistics.config;

import com.ner.logistics.accessibility.Corridor;
import com.ner.logistics.accessibility.CorridorRepository;
import com.ner.logistics.accessibility.District;
import com.ner.logistics.accessibility.DistrictRepository;
import com.ner.logistics.shipment.Shipment;
import com.ner.logistics.shipment.ShipmentRepository;
import com.ner.logistics.user.User;
import com.ner.logistics.user.UserRepository;
import com.ner.logistics.user.UserRole;
import com.ner.logistics.vehicle.Vehicle;
import com.ner.logistics.vehicle.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final DistrictRepository districtRepository;
    private final ShipmentRepository shipmentRepository;
    private final CorridorRepository corridorRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.ner.logistics.driver.DriverProfileRepository driverProfileRepository;

    @Override
    public void run(String... args) {
        // 1. Seed Demonstration Users for All 5 Core RBAC Roles
        if (userRepository.count() == 0) {
            userRepository.save(User.builder()
                    .username("admin")
                    .email("admin@sih.gov.in")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(UserRole.ADMIN)
                    .fullName("SIH System Administrator")
                    .phoneNumber("+91 9876543210")
                    .build());

            userRepository.save(User.builder()
                    .username("operator")
                    .email("logistics@sih.gov.in")
                    .password(passwordEncoder.encode("Operator@123"))
                    .role(UserRole.LOGISTICS_OPERATOR)
                    .fullName("Logistics Command Officer")
                    .phoneNumber("+91 9876543211")
                    .build());

            userRepository.save(User.builder()
                    .username("emergency")
                    .email("emergency@sih.gov.in")
                    .password(passwordEncoder.encode("Emergency@123"))
                    .role(UserRole.EMERGENCY_OPERATOR)
                    .fullName("Disaster & Emergency Responder")
                    .phoneNumber("+91 9876543214")
                    .build());

            userRepository.save(User.builder()
                    .username("officer")
                    .email("field@sih.gov.in")
                    .password(passwordEncoder.encode("Officer@123"))
                    .role(UserRole.FIELD_OFFICER)
                    .fullName("Haflong Field Officer")
                    .phoneNumber("+91 9876543212")
                    .build());

            userRepository.save(User.builder()
                    .username("driver")
                    .email("driver@sih.gov.in")
                    .password(passwordEncoder.encode("Driver@123"))
                    .role(UserRole.DRIVER)
                    .fullName("Convoy Driver NER-07")
                    .phoneNumber("+91 9876543213")
                    .build());
        }

        // 2. Seed North-East Convoy Vehicles
        if (vehicleRepository.count() == 0) {
            List<Vehicle> initialVehicles = List.of(
                    Vehicle.builder().code("NER-01").licensePlate("AS-01-AB-1001").vehicleType("Emergency Medicine Truck").capacityTons(8.5).status("ON_TRACK").build(),
                    Vehicle.builder().code("NER-02").licensePlate("AS-01-CD-2002").vehicleType("Oxygen Cylinder Supply").capacityTons(12.0).status("ON_TRACK").build(),
                    Vehicle.builder().code("NER-03").licensePlate("AS-02-EF-3003").vehicleType("Ration & Baby Food Tanker").capacityTons(10.0).status("ON_TRACK").build(),
                    Vehicle.builder().code("NER-04").licensePlate("AS-03-GH-4004").vehicleType("Fuel Tanker").capacityTons(15.0).status("ON_TRACK").build(),
                    Vehicle.builder().code("NER-05").licensePlate("AS-04-IJ-5005").vehicleType("Disaster Relief Goods").capacityTons(9.0).status("ON_TRACK").build(),
                    Vehicle.builder().code("NER-06").licensePlate("ML-05-KL-6006").vehicleType("Water Transport Truck").capacityTons(11.0).status("ON_TRACK").build(),
                    Vehicle.builder().code("NER-07").licensePlate("AS-01-HA-7007").vehicleType("Medical Critical Convoy").capacityTons(7.5).assignedDriverUsername("driver").status("ON_TRACK").build(),
                    Vehicle.builder().code("NER-08").licensePlate("TR-01-MN-8008").vehicleType("Bridge Repair Supplies").capacityTons(14.0).status("ON_TRACK").build()
            );
            vehicleRepository.saveAll(initialVehicles);
        }

        // 3. Seed North-East Districts
        if (districtRepository.count() == 0) {
            List<District> initialDistricts = List.of(
                    District.builder().name("Dima Hasao").code("DH").accessibilityPct(45.0).build(),
                    District.builder().name("Cachar").code("CH").accessibilityPct(82.0).build(),
                    District.builder().name("Karbi Anglong").code("KA").accessibilityPct(68.0).build(),
                    District.builder().name("East Khasi Hills").code("EKH").accessibilityPct(76.0).build()
            );
            districtRepository.saveAll(initialDistricts);
        }

        // 4. Seed Essential Logistics Shipments
        if (shipmentRepository.count() == 0) {
            List<Shipment> initialShipments = List.of(
                    Shipment.builder().vehicleCode("NER-07").assignedDriverUsername("driver").commodityType("MEDICINE").priority("CRITICAL").origin("Guwahati Central Store").destination("Silchar Civil Hospital").status("IN_TRANSIT").build(),
                    Shipment.builder().vehicleCode("NER-01").commodityType("OXYGEN_CYLINDERS").priority("CRITICAL").origin("Guwahati Industrial Oxygen").destination("Haflong Sub-Divisional Hospital").status("IN_TRANSIT").build(),
                    Shipment.builder().vehicleCode("NER-02").commodityType("BABY_FOOD").priority("HIGH").origin("Shillong Warehouse").destination("Silchar Relief Camp").status("IN_TRANSIT").build(),
                    Shipment.builder().vehicleCode("NER-04").commodityType("FUEL").priority("HIGH").origin("Numaligarh Refinery").destination("Haflong Power Substation").status("IN_TRANSIT").build()
            );
            shipmentRepository.saveAll(initialShipments);
        }

        // 5. Seed Dynamic Logistics Corridors
        if (corridorRepository.count() == 0) {
            List<Corridor> initialCorridors = List.of(
                    Corridor.builder().name("NH-27 Guwahati -> Silchar Corridor").code("COR-NH27").startPoint("Guwahati").endPoint("Silchar").lengthKm(340.0).accessibilityScorePct(42.0).status("HIGH_RISK").build(),
                    Corridor.builder().name("Haflong Mountain Bypass Corridor").code("COR-HAFLONG-BYPASS").startPoint("Umrangso").endPoint("Jatinga").lengthKm(132.0).accessibilityScorePct(88.0).status("ACCESSIBLE").build(),
                    Corridor.builder().name("Shillong -> Silchar National Highway").code("COR-NH44").startPoint("Shillong").endPoint("Silchar").lengthKm(215.0).accessibilityScorePct(74.0).status("DEGRADED").build()
            );
            corridorRepository.saveAll(initialCorridors);
        }

        // 6. Seed Driver Profile for existing authenticated Convoy Driver
        if (driverProfileRepository.count() == 0) {
            userRepository.findByUsername("driver").ifPresent(driverUser -> {
                Long shipmentId = shipmentRepository.findByVehicleCode("NER-07")
                        .stream().findFirst().map(Shipment::getId).orElse(null);

                com.ner.logistics.driver.DriverProfile profile = com.ner.logistics.driver.DriverProfile.builder()
                        .user(driverUser)
                        .licenseNumber("AS-01-2022-0049281")
                        .licenseCategory("TRANS_HEAVY")
                        .licenseExpiry(java.time.LocalDate.now().plusYears(3))
                        .operationalStatus("ON_TRIP")
                        .fitnessStatus("FIT")
                        .baseDepot("Guwahati Central Hub")
                        .currentLatitude(25.1500)
                        .currentLongitude(92.7000)
                        .assignedVehicleCode("NER-07")
                        .activeShipmentId(shipmentId)
                        .emergencyContactName("Sunita Gogoi")
                        .emergencyContactPhone("+91 9435012345")
                        .build();

                driverProfileRepository.save(profile);
            });
        }
    }
}
