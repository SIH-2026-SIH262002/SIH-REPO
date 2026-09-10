import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { sosApi } from '../../src/api/sos';
import { locationService } from '../../src/services/locationService';
import { useAuth } from '../../src/context/AuthContext';
import { SOSEvent } from '../../src/types';
import { Colors, Spacing, BorderRadius } from '../../src/constants/theme';
import { getApiErrorMessage } from '../../src/api/client';
import { Ionicons } from '@expo/vector-icons';

export default function SOSScreen() {
  const { user } = useAuth();

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [issueType, setIssueType] = useState('vehicle_breakdown');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [lastSOS, setLastSOS] = useState<SOSEvent | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const triggerEmergency = async () => {
    setSending(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Step 1: Capture precise location
      const pos = await locationService.getCurrentLocation();

      // Step 2: Dispatch SOS payload to FastAPI
      const res = await sosApi.triggerSOS({
        vehicle_id: user?.userId || 'MOB_V01',
        driver_name: user?.fullName || 'Field Officer',
        phone: user?.phone || '+919876543210',
        lat: pos.lat,
        lon: pos.lon,
        issue_type: issueType,
        message: message || 'EMERGENCY SOS: Immediate logistics/rescue assistance needed.',
      });

      setLastSOS(res.event);
      setSuccessMsg('EMERGENCY SOS DISPATCHED SUCCESSFULLY! Automated alerts sent to Disaster Management Command Center & Emergency Contacts.');
      setConfirmModalVisible(false);
      setMessage('');
    } catch (e: any) {
      setErrorMsg(getApiErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="EMERGENCY SOS"
        subtitle="One-Tap Emergency Dispatch System"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Alerts */}
        {successMsg ? (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <View style={styles.alertTextWrapper}>
              <Text style={styles.successTitle}>SOS DISPATCHED</Text>
              <Text style={styles.successSub}>{successMsg}</Text>
            </View>
          </View>
        ) : null}

        {errorMsg ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={24} color={Colors.sosRed} />
            <View style={styles.alertTextWrapper}>
              <Text style={styles.errorTitle}>DISPATCH FAILED</Text>
              <Text style={styles.errorSub}>{errorMsg}</Text>
            </View>
          </View>
        ) : null}

        {/* Huge Prominent SOS Trigger Button */}
        <View style={styles.sosButtonContainer}>
          <TouchableOpacity
            style={styles.sosCircle}
            onPress={() => setConfirmModalVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.sosInnerCircle}>
              <Ionicons name="alert-circle" size={64} color="#fff" />
              <Text style={styles.sosText}>S O S</Text>
              <Text style={styles.sosSubtext}>HOLD TO BROADCAST EMERGENCY</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Active Emergency Info */}
        <Card title="Emergency Response Contacts" icon="call">
          <View style={styles.contactRow}>
            <Ionicons name="call" size={16} color={Colors.sosRed} />
            <Text style={styles.contactText}>State Disaster Helpline: 1070 / 1077</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
            <Text style={styles.contactText}>NER Command Center: +91 9999900001</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="medical" size={16} color={Colors.success} />
            <Text style={styles.contactText}>Ambulance Emergency: 108</Text>
          </View>
        </Card>

        {/* Last SOS Dispatch Record */}
        {lastSOS && (
          <Card title="Recent Active SOS Status" icon="time">
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Event ID:</Text>
              <Text style={styles.statusVal}>{lastSOS.id}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Driver / Officer:</Text>
              <Text style={styles.statusVal}>{lastSOS.driver_name} ({lastSOS.phone})</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Location Captured:</Text>
              <Text style={styles.statusVal}>{lastSOS.lat.toFixed(4)}°, {lastSOS.lon.toFixed(4)}°</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Dispatch Status:</Text>
              <Text style={[styles.statusVal, { color: Colors.sosRed, fontWeight: '800' }]}>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={32} color={Colors.sosRed} />
              <Text style={styles.modalTitle}>CONFIRM EMERGENCY SOS</Text>
            </View>

            <Text style={styles.modalBodyText}>
              You are about to send an urgent emergency alert with your real-time GPS position to district authorities.
            </Text>

            {/* Issue Selector */}
            <Text style={styles.inputLabel}>ISSUE TYPE</Text>
            <View style={styles.issueTypesRow}>
              {[
                { id: 'vehicle_breakdown', label: 'Breakdown' },
                { id: 'medical', label: 'Medical' },
                { id: 'road_blocked', label: 'Landslide Block' },
                { id: 'accident', label: 'Accident' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.issueChip, issueType === item.id && styles.issueChipActive]}
                  onPress={() => setIssueType(item.id)}
                >
                  <Text style={[styles.issueChipText, issueType === item.id && styles.issueTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Additional Message */}
            <Text style={styles.inputLabel}>ADDITIONAL DETAILS (OPTIONAL)</Text>
            <TextInput
              style={styles.modalInput}
              value={message}
              onChangeText={setMessage}
              placeholder="e.g. Stuck near kilometer 42 due to severe rockfall..."
              placeholderTextColor={Colors.textSubtle}
            />

            {/* Action Buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfirmModalVisible(false)}
                disabled={sending}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, sending && styles.btnDisabled]}
                onPress={triggerEmergency}
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
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.success}20`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.success}40`,
    gap: Spacing.sm,
  },
  successTitle: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '800',
  },
  successSub: {
    color: Colors.text,
    fontSize: 12,
    marginTop: 2,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.sosRed}20`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: `${Colors.sosRed}40`,
    gap: Spacing.sm,
  },
  errorTitle: {
    color: Colors.sosRed,
    fontSize: 14,
    fontWeight: '800',
  },
  errorSub: {
    color: Colors.text,
    fontSize: 12,
    marginTop: 2,
  },
  alertTextWrapper: {
    flex: 1,
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
    backgroundColor: Colors.sosRed,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: Colors.sosGlow,
    shadowColor: Colors.sosRed,
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
    color: Colors.text,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  statusVal: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.sosRed,
    letterSpacing: 0.5,
  },
  modalBodyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
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
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  issueChipActive: {
    backgroundColor: Colors.sosRed,
    borderColor: Colors.sosRed,
  },
  issueChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  issueTextActive: {
    color: '#fff',
  },
  modalInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 13,
    marginBottom: Spacing.lg,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.background,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cancelBtnText: {
    color: Colors.textMuted,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1.5,
    backgroundColor: Colors.sosRed,
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
