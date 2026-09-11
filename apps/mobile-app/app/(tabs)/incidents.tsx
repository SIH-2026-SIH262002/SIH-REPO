import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { incidentsApi } from '../../src/api/incidents';
import { locationService } from '../../src/services/locationService';
import { useAuth } from '../../src/context/AuthContext';
import { useOffline } from '../../src/context/OfflineContext';
import { useTheme } from '../../src/context/ThemeContext';
import { IncidentReport } from '../../src/types';
import { Spacing, BorderRadius } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { OfflineQueueBanner } from '../../src/components/OfflineQueueBanner';

export default function IncidentsScreen() {
  const { user } = useAuth();
  const { enqueueReport } = useOffline();
  const { colors } = useTheme();

  const [incidentType, setIncidentType] = useState<'landslide' | 'flood' | 'road_blocked' | 'vibration' | 'other'>('landslide');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState(user?.phone || '+919876543210');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [lat, setLat] = useState<number>(25.5788);
  const [lon, setLon] = useState<number>(91.8933);
  const [fetchingGPS, setFetchingGPS] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [reportsList, setReportsList] = useState<IncidentReport[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    captureGPS();
    fetchReports();
  }, []);

  const captureGPS = async () => {
    setFetchingGPS(true);
    try {
      const pos = await locationService.getCurrentLocation();
      setLat(pos.lat);
      setLon(pos.lon);
    } catch (e) {
      console.warn('GPS error:', e);
    } finally {
      setFetchingGPS(false);
    }
  };

  const fetchReports = async () => {
    try {
      const list = await incidentsApi.getIncidents();
      setReportsList(list);
    } catch (e) {
      console.warn('Error fetching reports:', e);
    } finally {
      setLoadingList(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setStatusMsg({ type: 'error', text: 'Camera roll permission is required to attach photos.' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Error picking image:', e);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setStatusMsg({ type: 'error', text: 'Camera permission is required to take photos.' });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Error taking photo:', e);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter an incident description.' });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    const reportPayload: IncidentReport = {
      reporter_name: user?.fullName || 'Field Officer',
      phone: phone || user?.phone || '',
      incident_type: incidentType,
      description: description.trim(),
      lat,
      lon,
      photo_uri: photoUri,
      timestamp: new Date().toISOString(),
    };

    try {
      const created = await incidentsApi.createIncident(reportPayload);
      setStatusMsg({ type: 'success', text: 'Incident report submitted successfully to FastAPI backend!' });
      setReportsList((prev) => [created, ...prev]);
      // Reset form
      setDescription('');
      setPhotoUri(null);
    } catch (e: any) {
      console.warn('Incident submit error, queuing offline:', e);
      await enqueueReport(reportPayload);
      setStatusMsg({
        type: 'success',
        text: 'Network unavailable / error. Report saved locally & queued for auto-sync!',
      });
      setDescription('');
      setPhotoUri(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header
        title="Incident Reporting"
        subtitle="Submit Landslide & Road Hazard Logs"
        rightActionIcon="refresh-outline"
        onRightAction={fetchReports}
      />

      <OfflineQueueBanner />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {statusMsg && (
          <View
            style={[
              styles.statusBox,
              statusMsg.type === 'error'
                ? { backgroundColor: `${colors.sosRed}20`, borderColor: `${colors.sosRed}40` }
                : { backgroundColor: `${colors.success}20`, borderColor: `${colors.success}40` },
            ]}
          >
            <Ionicons
              name={statusMsg.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
              size={18}
              color={statusMsg.type === 'error' ? colors.sosRed : colors.success}
            />
            <Text
              style={[
                styles.statusText,
                { color: statusMsg.type === 'error' ? colors.sosRed : colors.success },
              ]}
            >
              {statusMsg.text}
            </Text>
          </View>
        )}

        {/* Submit Form Card */}
        <Card title="Report New Incident" icon="add-circle">
          {/* Incident Type Selectors */}
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>INCIDENT CATEGORY</Text>
          <View style={styles.typesRow}>
            {(['landslide', 'flood', 'road_blocked', 'vibration', 'other'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeChip,
                  { backgroundColor: colors.background, borderColor: colors.cardBorder },
                  incidentType === type && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setIncidentType(type)}
              >
                <Text style={[styles.typeChipText, { color: colors.textMuted }, incidentType === type && styles.typeTextActive]}>
                  {type.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description Input */}
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>DESCRIPTION & IMPACT</Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: colors.inputBg, borderColor: colors.cardBorder, color: colors.text },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe debris size, road blockage status, or immediate risk..."
            placeholderTextColor={colors.textSubtle}
            multiline
            numberOfLines={3}
          />

          {/* GPS Coordinates Bar */}
          <View style={[styles.gpsRow, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
            <View style={styles.gpsInfo}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={[styles.gpsText, { color: colors.text }]}>
                GPS: {lat.toFixed(4)}°, {lon.toFixed(4)}°
              </Text>
            </View>
            <TouchableOpacity style={styles.gpsRefreshBtn} onPress={captureGPS} disabled={fetchingGPS}>
              {fetchingGPS ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.gpsRefreshText, { color: colors.primary }]}>Update GPS</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Photo Attachment Bar */}
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>PHOTO EVIDENCE (OPTIONAL)</Text>
          {photoUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: photoUri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setPhotoUri(null)}>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoActionsRow}>
              <TouchableOpacity
                style={[styles.photoBtn, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}
                onPress={takePhoto}
              >
                <Ionicons name="camera" size={18} color={colors.primary} />
                <Text style={[styles.photoBtnText, { color: colors.text }]}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoBtn, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}
                onPress={pickImage}
              >
                <Ionicons name="images" size={18} color={colors.primary} />
                <Text style={[styles.photoBtnText, { color: colors.text }]}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.submitBtnText}>Submit Incident Report</Text>
              </>
            )}
          </TouchableOpacity>
        </Card>

        {/* Submitted Incidents Log */}
        <Card title="Submitted Incident Reports Log" icon="list">
          {loadingList ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : reportsList.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No incident reports logged yet.</Text>
          ) : (
            reportsList.map((rep, idx) => (
              <View key={rep.id || idx} style={[styles.reportItem, { borderBottomColor: colors.cardBorder }]}>
                <View style={styles.reportHeader}>
                  <Text style={[styles.reportType, { color: colors.primary }]}>{rep.incident_type.toUpperCase()}</Text>
                  <Text style={[styles.reportTime, { color: colors.textSubtle }]}>
                    {rep.timestamp ? new Date(rep.timestamp).toLocaleDateString() : 'Today'}
                  </Text>
                </View>
                <Text style={[styles.reportDesc, { color: colors.text }]}>{rep.description}</Text>
                <Text style={[styles.reportMeta, { color: colors.textMuted }]}>
                  Reporter: {rep.reporter_name} • Location: {rep.lat.toFixed(3)}°, {rep.lon.toFixed(3)}°
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
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
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: Spacing.sm,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  typeTextActive: {
    color: '#fff',
  },
  textArea: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
  },
  gpsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  gpsRefreshBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gpsRefreshText: {
    fontSize: 11,
    fontWeight: '700',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 6,
  },
  photoBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 120,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.md,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  reportItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reportType: {
    fontSize: 13,
    fontWeight: '800',
  },
  reportTime: {
    fontSize: 11,
  },
  reportDesc: {
    fontSize: 13,
  },
  reportMeta: {
    fontSize: 11,
    marginTop: 4,
  },
});
