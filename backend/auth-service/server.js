const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Auth = require('./index');
const SqliteStorageAdapter = require('./adapters/storage/sqlite');
const identityEngine = require('./core/identity');

const app = express();

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true
}));

app.use(express.json());

const dbAdapter = new SqliteStorageAdapter();

const normalizeRole = (inputRole) => {
    if (!inputRole) return 'FIELD_OFFICER';
    const upper = String(inputRole).toUpperCase();
    if (upper === 'SUPER_ADMIN') return 'ADMIN';
    if (upper === 'DISTRICT_AUTHORITY') return 'EMERGENCY_OPERATOR';
    const allowed = ['ADMIN', 'EMERGENCY_OPERATOR', 'LOGISTICS_OPERATOR', 'FIELD_OFFICER', 'DRIVER'];
    if (allowed.includes(upper)) return upper;
    return 'FIELD_OFFICER';
};

const claimsResolver = async ({ userId, sessionId, context }) => {
    const user = await dbAdapter.findUserById(userId);
    const meta = user?.metadata || {};
    const rawRole = meta.role || 'FIELD_OFFICER';
    const role = normalizeRole(rawRole);
    return {
        roles: [role],
        role: role,
        fullName: meta.fullName || user?.identifier || 'User',
        email: meta.email || user?.identifier || '',
        phone: meta.phone || '',
        organization: meta.organization || '',
        district: meta.district || '',
        tenant: context?.tenant || 'NER_LOGISTICS'
    };
};

const policyResolver = async ({ policy, claims, context }) => {
    if (!claims || !claims.role) return false;
    const role = normalizeRole(claims.role);
    if (policy === 'ADMIN' || policy === 'SUPER_ADMIN') return role === 'ADMIN';
    if (policy === 'EMERGENCY_OPERATOR' || policy === 'DISTRICT_AUTHORITY') return role === 'ADMIN' || role === 'EMERGENCY_OPERATOR';
    if (policy === 'LOGISTICS_OPERATOR') return role === 'ADMIN' || role === 'LOGISTICS_OPERATOR';
    if (policy === 'FIELD_OFFICER') return role === 'ADMIN' || role === 'FIELD_OFFICER';
    if (policy === 'DRIVER') return role === 'ADMIN' || role === 'DRIVER';
    return true;
};

const authSystem = Auth.init({
    storageAdapter: dbAdapter,
    claimsResolver: claimsResolver,
    policyResolver: policyResolver,
    jwtSecret: process.env.JWT_SECRET || 'super-secret-demo-key-123',
    accessExpiry: process.env.ACCESS_EXPIRY || '1m',
    refreshExpiryMs: parseInt(process.env.REFRESH_EXPIRY_MS, 10) || 1000 * 60 * 60 * 24,
    trustJwtClaims: true
});

// In development, log password reset token so you can test without email
authSystem.onPasswordResetRequested(({ identifier, rawToken, expiresAt }) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('[Dev] Password reset requested for:', identifier);
        console.log('[Dev] Reset token (use in Reset Password form):', rawToken);
        console.log('[Dev] Expires at:', expiresAt);
    }
});

app.use('/auth', authSystem.router);

// Zero-setup demo bootstrap: a closed-provisioning system has no
// self-registration, so *something* has to seed the very first Administrator.
// Mirrors the FastAPI gateway's built-in demo accounts (same identifiers/
// password/roles) so either backend gives the same out-of-the-box login.
// Only runs when no ADMIN exists yet -- never touches a real deployment that
// has already provisioned its own accounts.
async function seedDemoAccountsIfEmpty() {
    const existing = await identityEngine.getAllUsers();
    if (existing.some((u) => (u.metadata || {}).role === 'ADMIN')) return;

    const demoAccounts = [
        {
            identifier: 'admin@nerlogisense.gov.in',
            password: 'password123',
            metadata: {
                fullName: 'Dr. S. Roy', email: 'admin@nerlogisense.gov.in',
                phone: '+919876543212', role: 'ADMIN', district: 'East Khasi Hills',
                organization: 'NER LogiSense Command Center', accountStatus: 'ACTIVE'
            }
        },
        {
            identifier: 'officer@nerlogisense.gov.in',
            password: 'password123',
            metadata: {
                fullName: 'Rajesh Kumar', email: 'officer@nerlogisense.gov.in',
                phone: '+919876543210', role: 'FIELD_OFFICER', district: 'East Khasi Hills',
                organization: 'Meghalaya Disaster Management Authority', accountStatus: 'ACTIVE'
            }
        },
        {
            identifier: 'driver@nerlogisense.gov.in',
            password: 'password123',
            metadata: {
                fullName: 'Amit Sharma', email: 'driver@nerlogisense.gov.in',
                phone: '+919876543211', role: 'DRIVER', district: 'Kamrup Metro',
                organization: 'NER Logistics Fleet', accountStatus: 'ACTIVE'
            }
        }
    ];

    for (const account of demoAccounts) {
        try {
            await identityEngine.createUser(account);
            console.log(`[Seed] Provisioned demo account: ${account.identifier} (${account.metadata.role})`);
        } catch (err) {
            if (err.message !== 'IDENTIFIER_IN_USE') throw err;
        }
    }
}

seedDemoAccountsIfEmpty()
    .catch((err) => console.error('[Seed] Failed to seed demo accounts:', err))
    .finally(() => {
        app.listen(PORT, () => {
            console.log(`Auth Engine server running on http://localhost:${PORT}`);
            console.log('SQLite Database Storage Adapter is active.');
        });
    });
