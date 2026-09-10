package com.ner.logistics.device;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;

    @Transactional
    public Device registerDevice(String imei, String vehicleCode, String deviceName, String deviceType, String rawApiKey) {
        String keyHash = hashApiKey(rawApiKey);
        Device device = Device.builder()
                .imei(imei)
                .vehicleCode(vehicleCode)
                .deviceName(deviceName != null ? deviceName : "AIS140 Telematics Unit " + imei)
                .deviceType(deviceType != null ? deviceType : "AIS140_GPS")
                .apiKeyHash(keyHash)
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .lastSeenAt(LocalDateTime.now())
                .build();
        return deviceRepository.save(device);
    }

    @Transactional
    public Device assignDeviceToVehicle(String imei, String vehicleCode) {
        Device device = deviceRepository.findByImei(imei)
                .orElseThrow(() -> new IllegalArgumentException("Device not found with IMEI: " + imei));
        device.setVehicleCode(vehicleCode);
        device.setStatus("ACTIVE");
        return deviceRepository.save(device);
    }

    @Transactional
    public Device unassignDevice(String imei) {
        Device device = deviceRepository.findByImei(imei)
                .orElseThrow(() -> new IllegalArgumentException("Device not found with IMEI: " + imei));
        device.setVehicleCode(null);
        return deviceRepository.save(device);
    }

    @Transactional
    public boolean validateAndTouchDevice(String imei, String rawApiKey) {
        Optional<Device> optDevice = deviceRepository.findByImei(imei);
        if (optDevice.isEmpty()) {
            log.error("❌ Telematics Ingestion REJECTED: Unregistered device IMEI={}", imei);
            return false; 
        }

        Device device = optDevice.get();
        if ("REVOKED".equalsIgnoreCase(device.getStatus()) || "INACTIVE".equalsIgnoreCase(device.getStatus())) {
            log.error("❌ Telematics Ingestion REJECTED: Device IMEI={} status is {}", imei, device.getStatus());
            return false;
        }

        if (rawApiKey != null && device.getApiKeyHash() != null) {
            String hash = hashApiKey(rawApiKey);
            if (!hash.equals(device.getApiKeyHash())) {
                log.error("❌ Telematics Ingestion REJECTED: Device IMEI={} API key mismatch", imei);
                return false;
            }
        }

        device.setLastSeenAt(LocalDateTime.now());
        deviceRepository.save(device);
        return true;
    }

    public List<Device> getAllDevices() {
        return deviceRepository.findAll();
    }

    @Transactional
    public Device updateDeviceStatus(Long id, String status) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Device not found with id: " + id));
        device.setStatus(status);
        return deviceRepository.save(device);
    }

    public String hashApiKey(String rawKey) {
        if (rawKey == null) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }
}
