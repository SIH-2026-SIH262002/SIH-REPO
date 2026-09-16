import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { assistanceApi, MobileAssistanceInput } from '../../src/api/assistance';
import { locationService } from '../../src/services/locationService';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AssistanceScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [category, setCategory] = useState<'MEDICAL_EMERGENCY' | 'VEHICLE_BREAKDOWN' | 'UNABLE_TO_CONTINUE' | 'HAZARD_BLOCKED'>('VEHICLE_BREAKDOWN');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Cancellation modal
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await assistanceApi.getMyRequests();
      setRequests(data || []);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const pos = await locationService.getCurrentLocation();
      const payload: MobileAssistanceInput = {
        category,
        severity,
        latitude: pos?.latitude,
        longitude: pos?.longitude,
        operationalNotes: notes.trim() || undefined,
        locationDescription: pos ? `GPS: ${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}` : undefined,
      };

      await assistanceApi.requestAssistance(payload);
      Alert.alert('Request Sent', 'Logistics Operator and Command Center have been alerted. Assistance is being coordinated.');
      setNotes('');
      fetchRequests();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to submit assistance request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!selectedRequestId || !cancelReason.trim()) {
      Alert.alert('Required', 'Please enter a cancellation reason.');
      return;
    }
    try {
      await assistanceApi.cancelRequest(selectedRequestId, cancelReason);
      Alert.alert('Cancelled', 'Assistance request was cancelled.');
      setCancelModalVisible(false);
      setCancelReason('');
      setSelectedRequestId(null);
      fetchRequests();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to cancel.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Header title="Driver Assistance" subtitle="Operational & Emergency Coordination" />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Active Requests Section */}
        {requests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Active Requests</Text>
            {requests.map((r: any) => (
              <Card key={r.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={[styles.requestNumber, { color: colors.primary }]}>{r.requestNumber}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: r.status === 'OPEN' ? '#fef3c7' : '#dcfce7' }]}>
                    <Text style={[styles.statusBadgeText, { color: r.status === 'OPEN' ? '#92400e' : '#166534' }]}>
                      {r.status}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.categoryText, { color: colors.text }]}>{r.category?.replace(/_/g, ' ')}</Text>
                {r.dispatchedAction ? (
                  <Text style={[styles.dispatchedText, { color: colors.primary }]}>
                    Dispatched: {r.dispatchedAction}
                  </Text>
                ) : null}
                {r.status === 'OPEN' && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setSelectedRequestId(r.id);
                      setCancelModalVisible(true);
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel Request</Text>
                  </TouchableOpacity>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* New Request Form */}
        <Card style={styles.formCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Request Operational Assistance</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
            Alert Central Logistics Command of mechanical or driver-fitness impediments.
          </Text>

          {/* Category Picker */}
          <Text style={[styles.label, { color: colors.text }]}>Issue Category</Text>
          <View style={styles.pillContainer}>
            {[
              { id: 'VEHICLE_BREAKDOWN', label: 'Breakdown' },
              { id: 'UNABLE_TO_CONTINUE', label: 'Unable to Continue' },
              { id: 'MEDICAL_EMERGENCY', label: 'Medical' },
              { id: 'HAZARD_BLOCKED', label: 'Road Blocked' },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.pill,
                  category === item.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setCategory(item.id as any)}
              >
                <Text
                  style={[
                    styles.pillText,
                    category === item.id ? { color: '#ffffff', fontWeight: 'bold' } : { color: colors.text },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Severity Picker */}
          <Text style={[styles.label, { color: colors.text }]}>Urgency Level</Text>
          <View style={styles.pillContainer}>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[
                  styles.pill,
                  severity === lvl && {
                    backgroundColor: lvl === 'CRITICAL' ? '#ef4444' : lvl === 'HIGH' ? '#f59e0b' : colors.primary,
                    borderColor: 'transparent',
                  },
                ]}
                onPress={() => setSeverity(lvl as any)}
              >
                <Text
                  style={[
                    styles.pillText,
                    severity === lvl ? { color: '#ffffff', fontWeight: 'bold' } : { color: colors.text },
                  ]}
                >
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes Input */}
          <Text style={[styles.label, { color: colors.text }]}>Operational Notes (Optional)</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            multiline
            numberOfLines={3}
            placeholder="e.g. Broken leaf spring, loss of braking air pressure on slope..."
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
          />

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Assistance Request</Text>
            )}
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Cancel Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Cancel Assistance Request</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Please state why assistance is no longer required:
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, marginTop: 12 }]}
              multiline
              numberOfLines={2}
              placeholder="e.g. Issue resolved independently..."
              placeholderTextColor={colors.textMuted}
              value={cancelReason}
              onChangeText={setCancelReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCancelModalVisible(false)}>
                <Text style={{ color: colors.textMuted }}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleCancelRequest}>
                <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Confirm Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  requestCard: { padding: Spacing.md, gap: Spacing.xs, marginBottom: Spacing.xs },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestNumber: { fontWeight: '900', fontSize: 13, fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  categoryText: { fontSize: 13, fontWeight: 'bold' },
  dispatchedText: { fontSize: 11, fontStyle: 'italic', marginTop: 4 },
  cancelBtn: { alignSelf: 'flex-start', marginTop: 6, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: '#fee2e2' },
  cancelBtnText: { color: '#dc2626', fontSize: 11, fontWeight: '700' },
  formCard: { padding: Spacing.lg, gap: Spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardSubtitle: { fontSize: 12, marginBottom: Spacing.xs },
  label: { fontSize: 12, fontWeight: '700', marginTop: Spacing.xs },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: '#cbd5e1' },
  pillText: { fontSize: 11 },
  input: { borderWidth: 1, borderRadius: BorderRadius.md, padding: 10, fontSize: 12, textAlignVertical: 'top' },
  submitBtn: { paddingVertical: 12, borderRadius: BorderRadius.lg, alignItems: 'center', marginTop: Spacing.sm },
  submitBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  modalContent: { width: '100%', borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.sm },
  modalTitle: { fontSize: 15, fontWeight: '800' },
  modalSubtitle: { fontSize: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.sm },
  modalCancelBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: BorderRadius.md },
  modalConfirmBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: BorderRadius.md, backgroundColor: '#dc2626' },
});
