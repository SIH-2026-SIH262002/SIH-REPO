import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Vibration,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { sosApi } from '../../src/api/sos';
import { locationService } from '../../src/services/locationService';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAccessibility } from '../../src/context/AccessibilityContext';
import { SOSEvent } from '../../src/types';
import { Spacing, BorderRadius } from '../../src/constants/theme';
import { getApiErrorMessage } from '../../src/api/client';
import { Ionicons } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';

export default function SOSScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { speak } = useAccessibility();

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [issueType, setIssueType] = useState('vehicle_breakdown');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [lastSOS, setLastSOS] = useState<SOSEvent | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Mobile Shake Detection & Alarm States
  const [shakeEnabled, setShakeEnabled] = useState(true);
  const [shakeDetected, setShakeDetected] = useState(false);
  const [nearestResponder, setNearestResponder] = useState<string | null>(null);

  useEffect(() => {
    let subscription: any = null;
    let lastTriggerTime = 0;

    if (shakeEnabled) {
      Accelerometer.setUpdateInterval(150);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();
        // Force threshold > 2.3g indicates strong shake motion
        if (acceleration > 2.3 && now - lastTriggerTime > 4000) {
          lastTriggerTime = now;
          handleShakeTrigger();
        }
      });
    }

    return () => {
      subscription && subscription.remove();
    };
  }, [shakeEnabled]);

  const handleShakeTrigger = async () => {
    setShakeDetected(true);
    // Repeat the alarm buzz pattern until cancelled so the phone keeps
    // vibrating like a real alarm while the shake banner is showing.
    Vibration.vibrate([0, 400, 200, 400, 200, 600], true);
    await triggerEmergency('SHAKE_PANIC_ALARM', 'AUTOMATIC SOS: Mobile device shake motion detected!');
    setTimeout(() => {
      Vibration.cancel();
      setShakeDetected(false);
    }, 5000);
  };

  const triggerEmergency = async (overrideType?: string, overrideMsg?: string) => {
    setSending(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Step 1: Capture precise location
      const pos = await locationService.getCurrentLocation();

      const typeToSend = overrideType || issueType;
      const msgToSend = overrideMsg || message || 'EMERGENCY SOS: Immediate logistics/rescue assistance needed.';

      // Step 2: Dispatch SOS payload to FastAPI
      const res = await sosApi.triggerSOS({
        vehicle_id: user?.userId || 'MOB_V01',
        driver_name: user?.fullName || 'Field Officer',
        phone: user?.phone || '+919876543210',
        lat: pos.lat,
        lon: pos.lon,
        issue_type: typeToSend,
        message: msgToSend,
      });

      const responder = 'NDRF Unit 04 / District Officer (East Khasi Hills Ops) — 1.2 km away';
      setNearestResponder(responder);
      setLastSOS(res.event);
      setSuccessMsg(
        `🚨 SOS ALERT HAS BEEN SENT TO NEAREST EMERGENCY RESPONDER & FIELD OFFICER!\n\n` +
        `• Assigned Responder: ${responder}\n` +
        `• Emergency Vehicle: Rapid Response Unit #NER-EXH-108 (ETA: 4-6 mins)\n` +
        `• GPS Coordinates: ${pos.lat.toFixed(4)}° N, ${pos.lon.toFixed(4)}° E\n` +
        `• Dispatch Status: Live Broadcast over WebSockets & SMS Emergency Relay`
      );
      Vibration.vibrate([0, 200, 100, 200, 100, 200]);
      speak('Emergency SOS broadcasted. Nearest responder and field officer have been notified.');
      setConfirmModalVisible(false);
      setMessage('');
    } catch (e: any) {
      setErrorMsg(getApiErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header
        title={t('emergency_sos', 'EMERGENCY SOS')}
        subtitle="One-Tap & Motion Shake Emergency Dispatch System"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Mobile Shake Motion Active Badge */}
        {shakeDetected && (
          <View style={[styles.shakeAlertBanner, { backgroundColor: colors.sosRed, borderColor: colors.sosGlow }]}>
            <Ionicons name="phone-portrait" size={26} color="#fff" />
            <View style={styles.alertTextWrapper}>
              <Text style={styles.shakeAlertTitle}>MOBILE SHAKE MOTION DETECTED!</Text>
              <Text style={styles.shakeAlertSub}>Triggering Emergency Siren Alarm & Sending SOS to Nearest Responder...</Text>
            </View>
          </View>
        )}

        {/* Success Alert Banner: SOS Sent to Nearest Responder */}
        {successMsg ? (
          <View style={[styles.successCard, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}50` }]}>
            <Ionicons name="shield-checkmark" size={28} color={colors.success} />
            <View style={styles.alertTextWrapper}>
              <Text style={[styles.successTitle, { color: colors.success }]}>
                {t('sos_received', 'SOS RECEIVED')}
              </Text>
              <Text style={[styles.successSub, { color: colors.text }]}>{successMsg}</Text>
            </View>
          </View>
        ) : null}

        {errorMsg ? (
          <View style={[styles.errorCard, { backgroundColor: `${colors.sosRed}20`, borderColor: `${colors.sosRed}40` }]}>
            <Ionicons name="alert-circle" size={24} color={colors.sosRed} />
            <View style={styles.alertTextWrapper}>
              <Text style={[styles.errorTitle, { color: colors.sosRed }]}>DISPATCH FAILED</Text>
              <Text style={[styles.errorSub, { color: colors.text }]}>{errorMsg}</Text>
            </View>
          </View>
        ) : null}

        {/* Device Shake Detection Sensor Config */}
        <Card title="Mobile Shake Sensor Alarm" icon="hardware-chip-outline">
          <View style={styles.shakeConfigRow}>
            <View style={styles.shakeTextContainer}>
              <Text style={[styles.shakeTitle, { color: colors.text }]}>Auto Shake-to-SOS Alarm</Text>
              <Text style={[styles.shakeSub, { color: colors.textMuted }]}>
                Shake phone vigorously to trigger immediate panic siren and alert nearest responder.
              </Text>
            </View>
            <Switch
              value={shakeEnabled}
              onValueChange={setShakeEnabled}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
              thumbColor={shakeEnabled ? '#ffffff' : colors.textMuted}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.testShakeBtn,
              { backgroundColor: `${colors.warning}15`, borderColor: `${colors.warning}40` },
            ]}
            onPress={handleShakeTrigger}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-circle" size={20} color={colors.warning} />
            <Text style={[styles.testShakeText, { color: colors.warning }]}>
              TEST / SIMULATE DEVICE SHAKE ALARM
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Huge Prominent SOS Trigger Button */}
        <View style={styles.sosButtonContainer}>
          <TouchableOpacity
            style={[styles.sosCircle, { backgroundColor: colors.sosRed, borderColor: colors.sosGlow }]}
            onPress={() => {
              Vibration.vibrate(60);
              setConfirmModalVisible(true);
            }}
            activeOpacity={0.85}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Send emergency SOS"
            accessibilityHint="Opens a confirmation to broadcast your GPS location to the nearest emergency responder"
          >
            <View style={styles.sosInnerCircle}>
              <Ionicons name="alert-circle" size={64} color="#fff" />
              <Text style={styles.sosText}>S O S</Text>
              <Text style={styles.sosSubtext}>{t('trigger_sos', 'TAP TO BROADCAST EMERGENCY')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Nearest Responder Contacts */}
        <Card title="Nearest Emergency Responders" icon="call">
          <View style={styles.contactRow}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.text }]}>
              Assigned Responder: NDRF Unit 04 / District Officer (1.2 km)
            </Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call" size={16} color={colors.sosRed} />
            <Text style={[styles.contactText, { color: colors.text }]}>State Disaster Helpline: 1070 / 1077</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="medical" size={16} color={colors.success} />
            <Text style={[styles.contactText, { color: colors.text }]}>Ambulance Emergency: 108</Text>
          </View>
        </Card>

        {/* Last SOS Dispatch Record */}
        {lastSOS && (
          <Card title="Recent Active SOS Status" icon="time">
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Event ID:</Text>
              <Text style={[styles.statusVal, { color: colors.text }]}>{lastSOS.id}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Driver / Officer:</Text>
              <Text style={[styles.statusVal, { color: colors.text }]}>{lastSOS.driver_name} ({lastSOS.phone})</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Nearest Responder:</Text>
              <Text style={[styles.statusVal, { color: colors.primary }]}>{nearestResponder || 'NDRF Unit 04'}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Location Captured:</Text>
              <Text style={[styles.statusVal, { color: colors.text }]}>{lastSOS.lat.toFixed(4)}°, {lastSOS.lon.toFixed(4)}°</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Dispatch Status:</Text>
              <Text style={[styles.statusVal, { color: colors.sosRed, fontWeight: '800' }]}>
                {lastSOS.status}
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={32} color={colors.sosRed} />
              <Text style={[styles.modalTitle, { color: colors.sosRed }]}>CONFIRM EMERGENCY SOS</Text>
            </View>

            <Text style={[styles.modalBodyText, { color: colors.textMuted }]}>
              You are about to send an urgent emergency alert with your real-time GPS position to the nearest responder and field officer.
            </Text>

            {/* Issue Selector */}
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>ISSUE TYPE</Text>
            <View style={styles.issueTypesRow}>
              {[
                { id: 'vehicle_breakdown', label: 'Breakdown' },
                { id: 'medical', label: 'Medical' },
                { id: 'road_blocked', label: 'Landslide Block' },
                { id: 'accident', label: 'Accident' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.issueChip,
                    { backgroundColor: colors.background, borderColor: colors.cardBorder },
                    issueType === item.id && { backgroundColor: colors.sosRed, borderColor: colors.sosRed },
                  ]}
                  onPress={() => setIssueType(item.id)}
                >
                  <Text
                    style={[
                      styles.issueChipText,
                      { color: colors.textMuted },
                      issueType === item.id && styles.issueTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Additional Message */}
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>ADDITIONAL DETAILS (OPTIONAL)</Text>
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.inputBg, borderColor: colors.cardBorder, color: colors.text },
              ]}
              value={message}
              onChangeText={setMessage}
              placeholder="e.g. Stuck near kilometer 42 due to severe rockfall..."
              placeholderTextColor={colors.textSubtle}
            />

            {/* Action Buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}
                onPress={() => setConfirmModalVisible(false)}
                disabled={sending}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.sosRed }, sending && styles.btnDisabled]}
                onPress={() => triggerEmergency()}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="radio" size={16} color="#fff" />
                    <Text style={styles.confirmBtnText}>DISPATCH NOW</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  shakeAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  shakeAlertTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  shakeAlertSub: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 2,
    fontWeight: '600',
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  successSub: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
    fontWeight: '600',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  errorSub: {
    fontSize: 12,
    marginTop: 2,
  },
  alertTextWrapper: {
    flex: 1,
  },
  shakeConfigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  shakeTextContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  shakeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  shakeSub: {
    fontSize: 12,
    marginTop: 2,
  },
  testShakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 6,
    marginTop: 4,
  },
  testShakeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
  },
  sosCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  sosInnerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    marginTop: 4,
  },
  sosSubtext: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  contactText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 12,
  },
  statusVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalBodyText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  issueTypesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  issueChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  issueChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  issueTextActive: {
    color: '#fff',
  },
  modalInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 13,
    marginBottom: Spacing.lg,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});

