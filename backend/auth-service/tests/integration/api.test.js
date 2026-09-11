const request = require('supertest');
const express = require('express');
const Auth = require('../../index');
const MockStorageAdapter = require('../../adapters/storage/mock');
const identityEngine = require('../../core/identity');

describe('API Integration Flows', () => {
    let app, authSystem, mockAdapter, adminToken;

    beforeAll(async () => {
        app = express();
        app.use(express.json());

        mockAdapter = new MockStorageAdapter();

        // Mock claims resolver -- reads the provisioned role out of user metadata
        // so the registration-guard's `req.claims.role === 'ADMIN'` check (the
        // same shape the real server.js claimsResolver produces) can be exercised.
        const mockClaimsResolver = async (params) => {
            const user = await mockAdapter.findUserById(params.userId);
            const role = user?.metadata?.role || 'user';
            return { role, roles: [role], tenant: params.context?.tenant || 'default' };
        };

        // Very basic mock policy resolver
        const mockPolicyResolver = async ({ policy, claims, context }) => {
            if (policy === 'canViewDashboard') return !!claims.role; // any authenticated provisioned role
            if (policy === 'adminOnly') return claims.role === 'ADMIN';
            return false;
        };

        authSystem = Auth.init({
            storageAdapter: mockAdapter,
            claimsResolver: mockClaimsResolver,
            policyResolver: mockPolicyResolver,
            jwtSecret: 'integration-secret-key',
            accessExpiry: '1m', // Short for testing
            refreshExpiryMs: 1000 * 60 * 60 * 24 // 1 day
        });

        app.use('/auth', authSystem.router);

        // Protected test route
        app.get('/api/dashboard',
            authSystem.authenticate,
            authSystem.authorize('canViewDashboard'),
            (req, res) => {
                res.json({ message: 'Welcome to Dashboard', user: req.identity });
            }
        );

        // Admin test route
        app.get('/api/admin',
            authSystem.authenticate,
            authSystem.authorize('adminOnly'),
            (req, res) => {
                res.json({ message: 'Welcome Admin' });
            }
        );

        // Bootstrap the very first Administrator out-of-band. A closed
        // provisioning system has no self-registration path, so the first
        // account must be seeded directly (mirrors how a real deployment
        // would seed its first Admin via a migration/fixture, not an API call).
        identityEngine.__init__(mockAdapter);
        await identityEngine.createUser({
            identifier: 'admin@test.com',
            password: 'admin_password_123',
            metadata: { role: 'ADMIN', fullName: 'Test Admin' }
        });
        const adminLoginRes = await request(app)
            .post('/auth/login')
            .send({ email: 'admin@test.com', password: 'admin_password_123' });
        adminToken = adminLoginRes.body.accessToken;
    }, 20000); // bcrypt (12 rounds) x several accounts can exceed the 5s default under parallel-worker CPU contention

    let userId, accessToken, refreshToken, sessionId;

    test('1a. Register rejected without authentication (401)', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'flow@test.com', password: 'secure_password' });

        expect(res.statusCode).toBe(401);
    });

    test('1b. Register rejected for an authenticated non-Admin caller (403)', async () => {
        await identityEngine.createUser({ identifier: 'nonadmin@test.com', password: 'password_1234' });
        const loginRes = await request(app)
            .post('/auth/login')
            .send({ email: 'nonadmin@test.com', password: 'password_1234' });

        const res = await request(app)
            .post('/auth/register')
            .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
            .send({ email: 'flow@test.com', password: 'secure_password' });

        expect(res.statusCode).toBe(403);
    });

    test('1c. Admin can provision a new account', async () => {
        const res = await request(app)
            .post('/auth/register')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                email: 'flow@test.com',
                password: 'secure_password',
                role: 'FIELD_OFFICER',
                district: 'Kamrup Metro',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.userId).toBeDefined();
        expect(res.body.user.role).toBe('FIELD_OFFICER');
        expect(res.body.user.district).toBe('Kamrup Metro');
        userId = res.body.userId;
    });

    test('1d. Register rejects an unrecognized role', async () => {
        const res = await request(app)
            .post('/auth/register')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ email: 'bad-role@test.com', password: 'secure_password', role: 'WAREHOUSE_MANAGER', district: 'Kamrup Metro' });

        expect(res.statusCode).toBe(400);
    });

    test('1e. Register rejects an unrecognized district', async () => {
        const res = await request(app)
            .post('/auth/register')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ email: 'bad-district@test.com', password: 'secure_password', role: 'DRIVER', district: 'Atlantis' });

        expect(res.statusCode).toBe(400);
    });

    test('2. Login successfully returns tokens', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'flow@test.com', password: 'secure_password' });

        expect(res.statusCode).toBe(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();

        accessToken = res.body.accessToken;
        refreshToken = res.body.refreshToken;
        sessionId = res.body.sessionId;

        expect(sessionId).toBeDefined();
    });

    test('3. Access protected route with valid token', async () => {
        const res = await request(app)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Welcome to Dashboard');
    });

    test('4. Fail to access protected route with invalid policy', async () => {
        const res = await request(app)
            .get('/api/admin')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('FORBIDDEN_POLICY_DENIED');
    });

    test('5. Refresh token returns new access token', async () => {
        const res = await request(app)
            .post('/auth/refresh')
            .send({ refreshToken, sessionId });

        expect(res.statusCode).toBe(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
        // JWTs generate the same string within the same second for identical payloads.\n        // expect(res.body.accessToken).not.toBe(accessToken);
        expect(res.body.refreshToken).not.toBe(refreshToken);

        // Update tokens for next test
        accessToken = res.body.accessToken;
        refreshToken = res.body.refreshToken;
    });

    test('6. Logout revokes session', async () => {
        const res = await request(app)
            .post('/auth/logout')
            .send({ sessionId });

        expect(res.statusCode).toBe(200);

        // Verify in mock DB
        const session = await mockAdapter.findSession(sessionId);
        expect(session.revoked).toBe(true);
    });
});
