const express = require('express');
const identityEngine = require('../core/identity');
const sessionEngine = require('../core/session');
const tokenEngine = require('../core/token');
const claimsEngine = require('../core/claims');
const passwordResetEngine = require('../core/passwordReset');
const events = require('../core/events');

const authenticateMiddleware = require('../middleware/authenticate')({ trustJwtClaims: true });

const getContext = (req) => ({
    requestIp: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
    tenant: req.headers['x-tenant-id'] || null
});

const handleLoginSuccess = async (user, req, res) => {
    try {
        const deviceInfo = { userAgent: req.headers['user-agent'] };
        const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
        const tenantId = req.headers['x-tenant-id'] || null;

        const { session, rawRefreshToken } = await sessionEngine.createSession({
            userId: user.id,
            deviceInfo,
            ipAddress,
            tenantId
        });

        const context = getContext(req);
        const claims = await claimsEngine.resolveClaims({
            userId: user.id,
            sessionId: session.sessionId,
            context
        });

        const payload = {
            sub: user.id,
            sid: session.sessionId,
            claims,
            tenant: tenantId
        };
        const accessToken = tokenEngine.generateAccessToken(payload);

        events.emit(events.EVENTS.LOGIN_SUCCESS, { userId: user.id, sessionId: session.sessionId });

        const metadata = user.metadata || {};

        return res.json({
            accessToken,
            refreshToken: rawRefreshToken,
            sessionId: session.sessionId,
            expiresIn: tokenEngine.ACCESS_EXPIRY,
            user: {
                id: user.id,
                fullName: metadata.fullName || claims.fullName || 'User',
                email: metadata.email || user.identifier,
                phone: metadata.phone || '',
                role: metadata.role || claims.role || 'FIELD_OFFICER',
                organization: metadata.organization || '',
                district: metadata.district || ''
            }
        });
    } catch (err) {
        console.error('Login Logic Error:', err);
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
};

module.exports = function createRouter(options = {}) {
    const { externalAuthResolver } = options;
    const router = express.Router();

    // --- Helper: Role Normalization ---
    const normalizeCanonicalRole = (inputRole) => {
        if (!inputRole) return 'FIELD_OFFICER';
        const upper = String(inputRole).toUpperCase();
        if (upper === 'SUPER_ADMIN') return 'ADMIN';
        if (upper === 'DISTRICT_AUTHORITY') return 'EMERGENCY_OPERATOR';
        const allowed = ['ADMIN', 'EMERGENCY_OPERATOR', 'LOGISTICS_OPERATOR', 'FIELD_OFFICER', 'DRIVER'];
        if (allowed.includes(upper)) return upper;
        return 'FIELD_OFFICER';
    };

    // --- Register ---
    router.post('/register', async (req, res) => {
        try {
            const { fullName, email, phone, identifier, password, role, organization, district, metadata = {} } = req.body;
            const resolvedIdentifier = email || phone || identifier;

            if (!resolvedIdentifier || !password) {
                return res.status(400).json({ error: 'Email/Phone identifier and password required' });
            }

            // Closed System Security Enforcement: Public self-registration is strictly disabled.
            // Only authenticated Administrators can provision new accounts via this endpoint.
            const authHeader = req.headers.authorization;
            const isCallerAdmin = authHeader && (req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN');
            if (!isCallerAdmin) {
                return res.status(403).json({
                    error: 'Access Denied: Public self-registration is disabled. Account provisioning requires Administrator authorization.'
                });
            }

            let canonicalRole = normalizeCanonicalRole(role);

            const combinedMetadata = {
                fullName: fullName || '',
                email: email || resolvedIdentifier,
                phone: phone || '',
                role: canonicalRole,
                organization: organization || '',
                district: district || '',
                ...metadata
            };

            const user = await identityEngine.createUser({
                identifier: resolvedIdentifier,
                password,
                metadata: combinedMetadata
            });
            events.emit('registrationSuccess', { userId: user.id });

            return res.status(201).json({
                message: 'User registered successfully',
                userId: user.id,
                user: {
                    id: user.id,
                    fullName: combinedMetadata.fullName,
                    email: combinedMetadata.email,
                    phone: combinedMetadata.phone,
                    role: combinedMetadata.role,
                    organization: combinedMetadata.organization,
                    district: combinedMetadata.district
                }
            });
        } catch (err) {
            if (err.message === 'IDENTIFIER_IN_USE') {
                return res.status(409).json({ error: 'Identifier/Email already exists' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // --- Login ---
    router.post('/login', async (req, res) => {
        try {
            const { email, identifier, password } = req.body;
            const resolvedIdentifier = identifier || email;

            if (!resolvedIdentifier || !password) {
                return res.status(400).json({ error: 'Identifier and password required' });
            }

            const user = await identityEngine.findUserByIdentifier(resolvedIdentifier);

            if (!user) {
                events.emit(events.EVENTS.LOGIN_FAILURE, { identifier: resolvedIdentifier, reason: 'USER_NOT_FOUND' });
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const isValid = await identityEngine.verifyPassword(user, password);
            if (!isValid) {
                events.emit(events.EVENTS.LOGIN_FAILURE, { userId: user.id, reason: 'INVALID_PASSWORD' });
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            await handleLoginSuccess(user, req, res);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // --- External auth (e.g. OAuth/SAML) – universal integration
    if (typeof externalAuthResolver === 'function') {
        router.post('/external', async (req, res) => {
            try {
                const { provider, token, profile } = req.body;
                if (!provider || !token) {
                    return res.status(400).json({ error: 'provider and token required' });
                }

                const result = await externalAuthResolver({ provider, token, profile, req });
                if (!result || !result.userId) {
                    return res.status(401).json({ error: 'Invalid or expired external token' });
                }

                const user = await identityEngine.findUserById(result.userId);
                if (!user) {
                    return res.status(401).json({ error: 'User not found' });
                }

                await handleLoginSuccess(user, req, res);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });
    }

    // --- Refresh ---
    router.post('/refresh', async (req, res) => {
        try {
            const { refreshToken, sessionId } = req.body;

            if (!refreshToken || !sessionId) {
                return res.status(400).json({ error: 'sessionId and refreshToken required' });
            }

            const { session, newRawRefreshToken } = await sessionEngine.rotateRefreshToken(sessionId, refreshToken);

            const user = await identityEngine.findUserById(session.userId);
            if (!user || (user.is_active === false && user.is_active !== undefined)) {
                await sessionEngine.revokeSession(sessionId);
                return res.status(403).json({ error: 'USER_DISABLED' });
            }

            const context = getContext(req);
            const claims = await claimsEngine.resolveClaims({
                userId: user.id,
                sessionId: session.sessionId,
                context
            });

            const tenant = session.tenantId != null ? session.tenantId : context.tenant;
            const payload = {
                sub: user.id,
                sid: session.sessionId,
                claims,
                tenant
            };
            const newAccessToken = tokenEngine.generateAccessToken(payload);

            return res.json({
                accessToken: newAccessToken,
                refreshToken: newRawRefreshToken,
                sessionId: session.sessionId
            });
        } catch (err) {
            return res.status(401).json({ error: err.message });
        }
    });

    // --- Logout ---
    router.post('/logout', async (req, res) => {
        try {
            const { sessionId } = req.body;
            if (!sessionId) {
                return res.status(400).json({ error: 'sessionId required' });
            }

            await sessionEngine.revokeSession(sessionId);
            return res.json({ message: 'Session revoked successfully' });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    });

    // --- Forgot password ---
    router.post('/forgot-password', async (req, res) => {
        try {
            const { email, identifier } = req.body;
            const resolvedIdentifier = identifier || email;

            if (!resolvedIdentifier) {
                return res.status(400).json({ error: 'Identifier or email required' });
            }

            const result = await passwordResetEngine.requestPasswordReset(resolvedIdentifier);

            // Always return 200 to avoid leaking whether the user exists
            if (result) {
                events.emit(events.EVENTS.PASSWORD_RESET_REQUESTED, {
                    userId: result.userId,
                    identifier: result.identifier,
                    rawToken: result.rawToken,
                    expiresAt: result.expiresAt
                });
            }

            return res.json({
                message: 'If an account exists for this identifier, a reset link has been sent.'
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // --- Reset password (with token from email link) ---
    router.post('/reset-password', async (req, res) => {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({ error: 'token and newPassword required' });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters' });
            }

            await passwordResetEngine.resetPasswordWithToken(token, newPassword);
            events.emit(events.EVENTS.PASSWORD_RESET_COMPLETED, {});

            return res.json({ message: 'Password has been reset successfully' });
        } catch (err) {
            if (err.message === 'INVALID_OR_EXPIRED_RESET_TOKEN') {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // --- Authenticated Profile / User endpoints ---

    router.get('/me', authenticateMiddleware, async (req, res) => {
        try {
            const user = await identityEngine.findUserById(req.identity.id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            const meta = user.metadata || {};
            return res.json({
                id: user.id,
                fullName: meta.fullName || req.claims?.fullName || 'User',
                email: meta.email || user.identifier,
                phone: meta.phone || '',
                role: meta.role || req.claims?.role || 'FIELD_OFFICER',
                organization: meta.organization || '',
                district: meta.district || '',
                is_active: user.is_active,
                created_at: user.created_at
            });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    });

    router.put('/profile', authenticateMiddleware, async (req, res) => {
        try {
            const { fullName, phone, organization, district } = req.body;
            const updatedUser = await identityEngine.updateUserMetadata(req.identity.id, {
                ...(fullName !== undefined && { fullName }),
                ...(phone !== undefined && { phone }),
                ...(organization !== undefined && { organization }),
                ...(district !== undefined && { district })
            });

            const meta = updatedUser.metadata || {};
            return res.json({
                message: 'Profile updated successfully',
                user: {
                    id: updatedUser.id,
                    fullName: meta.fullName || '',
                    email: meta.email || updatedUser.identifier,
                    phone: meta.phone || '',
                    role: meta.role || 'FIELD_OFFICER',
                    organization: meta.organization || '',
                    district: meta.district || ''
                }
            });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    });

    router.post('/change-password', authenticateMiddleware, async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: 'currentPassword and newPassword required' });
            }
            if (newPassword.length < 8) {
                return res.status(400).json({ error: 'New password must be at least 8 characters' });
            }
            await identityEngine.changePassword(req.identity.id, currentPassword, newPassword);
            return res.json({ message: 'Password updated successfully' });
        } catch (err) {
            if (err.message === 'INVALID_CURRENT_PASSWORD') {
                return res.status(400).json({ error: 'Invalid current password' });
            }
            return res.status(500).json({ error: err.message });
        }
    });

    router.get('/users', authenticateMiddleware, async (req, res) => {
        try {
            const role = req.claims?.role || '';
            if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
                return res.status(403).json({ error: 'Access denied: Admin privileges required' });
            }
            const users = await identityEngine.getAllUsers();
            return res.json({ users });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    });

    return router;
};
