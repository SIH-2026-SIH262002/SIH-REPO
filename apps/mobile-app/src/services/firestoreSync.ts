import { db, doc, setDoc, onSnapshot, collection, serverTimestamp } from './firebase';
import { RouteStatus } from '../types';

export interface SharedRouteState {
  routeId: string;
  routeName: string;
  status: RouteStatus;
  blockedReason?: string;
  updatedByRole: string;
  updatedByDevice: string;
  updatedAt?: any;
}

export interface SharedAlertState {
  alertId: string;
  title: string;
  severity: 'HIGH' | 'SEVERE' | 'MODERATE' | 'LOW';
  district: string;
  updatedBy: string;
  timestamp?: any;
}

/**
 * Firestore Real-time Sync helper for Multi-Phone Hopping.
 * Allows Phone 1 (Driver) to instantly receive live Route & Alert updates
 * posted by Phone 2 (Field Officer / Admin) via onSnapshot listeners.
 */
export const firestoreSync = {
  /**
   * Update Route Status in Firestore (e.g. Field Officer marks Route A as BLOCKED).
   */
  async updateRouteStatus(
    routeId: string,
    routeName: string,
    status: RouteStatus,
    reason: string,
    role: string,
    deviceId: string
  ) {
    try {
      const ref = doc(db, 'routes', routeId);
      await setDoc(
        ref,
        {
          routeId,
          routeName,
          status,
          blockedReason: reason,
          updatedByRole: role,
          updatedByDevice: deviceId,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore updateRouteStatus error (offline fallback mode):', e);
    }
  },

  /**
   * Realtime listener for Route status changes (onSnapshot).
   */
  subscribeRouteStatus(routeId: string, callback: (route: SharedRouteState | null) => void) {
    try {
      const ref = doc(db, 'routes', routeId);
      return onSnapshot(
        ref,
        (snapshot) => {
          if (snapshot.exists()) {
            callback(snapshot.data() as SharedRouteState);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.warn('Firestore route listener warning:', error);
        }
      );
    } catch (e) {
      console.warn('Firestore listener subscription failed:', e);
      return () => {};
    }
  },

  /**
   * Realtime listener for all shared routes collection (onSnapshot).
   */
  subscribeAllRoutes(callback: (routes: SharedRouteState[]) => void) {
    try {
      const colRef = collection(db, 'routes');
      return onSnapshot(
        colRef,
        (snapshot) => {
          const list: SharedRouteState[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as SharedRouteState);
          });
          callback(list);
        },
        (error) => {
          console.warn('Firestore routes list listener warning:', error);
        }
      );
    } catch (e) {
      console.warn('Firestore routes collection subscription failed:', e);
      return () => {};
    }
  },
};
