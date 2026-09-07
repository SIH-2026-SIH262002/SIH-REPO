package com.ner.logistics.sos;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SosServiceTest {

    @Mock
    private SosEventRepository sosEventRepository;

    @Mock
    private SosAckRepository sosAckRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private SosService sosService;

    @BeforeEach
    void setUp() {
        sosService = new SosService(sosEventRepository, sosAckRepository, messagingTemplate);
    }

    @Test
    void testProcessRelayedSosSuccess() {
        SosRelayRequestDto relayDto = SosRelayRequestDto.builder()
                .meshPacketId("SOS-MESH-NER07-99881")
                .originVehicleCode("NER-07")
                .originLatitude(25.1234)
                .originLongitude(92.5678)
                .emergencyType("LANDSLIDE_TRAPPED")
                .message("Trapped in Haflong pass zero connectivity valley")
                .originTimestamp(LocalDateTime.now().minusMinutes(20))
                .relayedByVehicleCode("NER-02")
                .hopCount(1)
                .build();

        when(sosEventRepository.findByMeshPacketId("SOS-MESH-NER07-99881")).thenReturn(Optional.empty());
        when(sosEventRepository.save(any(SosEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SosEvent result = sosService.processRelayedSos(relayDto);

        assertNotNull(result);
        assertEquals("NER-07", result.getVehicleCode());
        assertEquals("MESH_RELAY_STORE_FORWARD", result.getDeliveryType());
        assertEquals("NER-02", result.getRelayedByVehicle());
        assertEquals(1, result.getRelayHopCount());
        verify(sosAckRepository, times(1)).save(any(SosAck.class));
    }

    @Test
    void testProcessRelayedSosDuplicateRejection() {
        SosRelayRequestDto relayDto = SosRelayRequestDto.builder()
                .meshPacketId("SOS-MESH-NER07-99881")
                .originVehicleCode("NER-07")
                .originLatitude(25.1234)
                .originLongitude(92.5678)
                .relayedByVehicleCode("NER-04")
                .hopCount(2)
                .build();

        SosEvent existing = SosEvent.builder().meshPacketId("SOS-MESH-NER07-99881").vehicleCode("NER-07").build();
        when(sosEventRepository.findByMeshPacketId("SOS-MESH-NER07-99881")).thenReturn(Optional.of(existing));

        SosEvent result = sosService.processRelayedSos(relayDto);

        assertEquals(existing, result);
        verify(sosEventRepository, never()).save(any(SosEvent.class));
    }

    @Test
    void testProcessRelayedSosMaxHopsExceeded() {
        SosRelayRequestDto relayDto = SosRelayRequestDto.builder()
                .meshPacketId("SOS-MESH-NER07-99881")
                .originVehicleCode("NER-07")
                .originLatitude(25.1234)
                .originLongitude(92.5678)
                .relayedByVehicleCode("NER-06")
                .hopCount(6) // Exceeds max 5
                .build();

        assertThrows(IllegalArgumentException.class, () -> sosService.processRelayedSos(relayDto));
    }

    @Test
    void testBleProtocolSpecFraming() {
        SosProtocolSpec.BinaryPacketFrame frame = SosProtocolSpec.BinaryPacketFrame.builder()
                .meshPacketId("PKT-1001")
                .originVehicleCode("NER-07")
                .carrierVehicleCode("NER-02")
                .latitude(25.1234)
                .longitude(92.5678)
                .timestampEpochSec(System.currentTimeMillis() / 1000L)
                .hopCount(2)
                .ttlHours(12)
                .crcChecksum("CRC32-OK")
                .build();

        assertFalse(frame.isExpired(System.currentTimeMillis() / 1000L));
        assertEquals(247, SosProtocolSpec.MAX_BLE_MTU_BYTES);
        assertEquals("0000FE-NER-0000-1000-8000-00805F9B34FB", SosProtocolSpec.BLE_SERVICE_UUID);
    }
}
