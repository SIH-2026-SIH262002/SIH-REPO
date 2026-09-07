package com.ner.logistics.sos;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Concrete protocol specification for Store-Carry-Forward SOS P2P Mesh over BLE & LoRa Gateway.
 * Addresses Architecture Review Item #1 (GATT Service, MTU negotiation, discovery window, TTL, path accumulator).
 */
public class SosProtocolSpec {

    // GATT Service & Characteristic UUIDs
    public static final String BLE_SERVICE_UUID = "0000FE-NER-0000-1000-8000-00805F9B34FB";
    public static final String BLE_CHAR_SOS_PAYLOAD = "0000FE-NER-0001-1000-8000-00805F9B34FB";
    public static final String BLE_CHAR_PATH_LINEAGE = "0000FE-NER-0002-1000-8000-00805F9B34FB";
    public static final String BLE_CHAR_ACK = "0000FE-NER-0003-1000-8000-00805F9B34FB";

    // Protocol Constants
    public static final int MAX_BLE_MTU_BYTES = 247;
    public static final int BLE_TRANSFER_TIME_MS = 120; // Fit within ~3-5 sec 40km/h passing window
    public static final int MAX_HOPS = 5;
    public static final int TTL_HOURS = 12;

    // LoRa Mesh Gateway Specifications
    public static final String LORA_FREQUENCY_MHZ = "865.0"; // India ISM band (865-867 MHz)
    public static final int LORA_TX_POWER_DBM = 20;

    @Data
    @Builder
    public static class BinaryPacketFrame {
        private String meshPacketId;        // CRC32 / SHA256 unique ID
        private String originVehicleCode;   // Trapped vehicle
        private String carrierVehicleCode;  // Current carrier
        private double latitude;
        private double longitude;
        private long timestampEpochSec;
        private int hopCount;
        private int ttlHours;
        private List<String> pathAccumulator; // Lineage chain of relay vehicle codes
        private String emergencyType;
        private String crcChecksum;

        public boolean isExpired(long currentEpochSec) {
            long ageSec = currentEpochSec - timestampEpochSec;
            return ageSec > (ttlHours * 3600L) || hopCount > MAX_HOPS;
        }
    }
}
