const express = require('express');
const identityEngine = require('../core/identity');
const sessionEngine = require('../core/session');
const tokenEngine = require('../core/token');
const claimsEngine = require('../core/claims');
const passwordResetEngine = require('../core/passwordReset');
const events = require('../core/events');
const { CANONICAL_DISTRICTS } = require('../core/districts');

// Strips password_hash and shapes a storage-adapter user row for API responses.
// Never return a raw adapter row directly -- some adapter methods `.returning()`
// every column, password_hash included.
const publicUser = (u) => ({
    id: u.id,
    identifier: u.identifier,
    is_active: u.is_active,
    status: identityEngine.deriveAccountStatus(u),
    metadata: u.metadata,
    created_at: u.created_at,
    updated_at: u.updated_at
});

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
        const allowed = ['ADMIN', 'EMERGENCY_OPERATOR', 'LOGISTICS_OPERATOR', 'FIELD_OFFICER', 'DRIVER', 'LOCAL_USER'];
        if (allowed.includes(upper)) return upper;
        return 'FIELD_OFFICER';
    };


    // --- Register ---
    // Closed System Security Enforcement: Public self-registration is strictly
    // disabled. Only an authenticated Administrator may provision new accounts.
    // BUG FIX: this previously checked `req.user?.role`, a field nothing ever
    // sets (authenticateMiddleware attaches `req.claims`), so the guard always
    // evaluated to false and every call -- including a genuine Admin's -- was
    // rejected with 403. Requiring the middleware here means a missing/invalid
    // token now correctly fails with 401 instead of silently falling through.
    router.post('/register', authenticateMiddleware, async (req, res) => {
        try {
            const { fullName, email, phone, identifier, password, role, organization, district, metadata = {} } = req.body;
            const resolvedIdentifier = email || phone || identifier;

            if (!resolvedIdentifier || !password) {
                return res.status(400).json({ error: 'Email/Phone identifier and password required' });
            }
            if (password.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters' });
            }

            const isCallerAdmin = req.claims?.role === 'ADMIN';
            if (!isCallerAdmin) {
                return res.status(403).json({
                    error: 'Access Denied: Public self-registration is disabled. Account provisioning requires Administrator authorization.'
                });
            }

            // SECURITY: strictly reject an unrecognized role/district instead of
            // silently coercing it to a default. The Admin Console UI only ever
            // submits one of these values via controlled dropdowns, but the
            // server must not rely on that -- any other caller of this endpoint
            // gets the same validation the FastAPI mirror already enforces.
            const requestedRole = String(role || '').toUpperCase();
            if (!identityEngine.ALLOWED_ROLES.includes(requestedRole)) {
                return res.status(400).json({
                    error: `Invalid role '${role}'. Must be one of: ${identityEngine.ALLOWED_ROLES.join(', ')}`
                });
            }
            const requestedDistrict = String(district || '').trim();
            if (!CANONICAL_DISTRICTS.includes(requestedDistrict)) {
                return res.status(400).json({
                    error: `Unknown district '${district}'. Must be one of the 18 NER districts.`
                });
            }

            const canonicalRole = requestedRole;

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

            // SECURITY: a suspended/deactivated account must be blocked at
            // login, not only on refresh -- otherwise Admin's "suspend user"
            // action has no real effect until an existing token expires.
            const accountStatus = identityEngine.deriveAccountStatus(user);
            if (accountStatus !== 'ACTIVE') {
                events.emit(events.EVENTS.LOGIN_FAILURE, { userId: user.id, reason: `ACCOUNT_${accountStatus}` });
                return res.status(403).json({
                    error: 'Account is suspended or deactivated. Contact system administrator.'
                });
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
            return res.json({ users: users.map(publicUser) });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    });

    // --- Admin account lifecycle ---
    // docs/architecture/PERMISSIONS.md: USER_SUSPEND / USER_REACTIVATE /
    // USER_DEACTIVATE / ROLE_MANAGE -- all ADMIN-only, GLOBAL scope, HIGH-to-
    // CRITICAL risk, confirmation required client-side, self-protection and
    // last-active-Administrator protection enforced here server-side.

    router.patch('/users/:id/status', authenticateMiddleware, async (req, res) => {
        try {
            if (req.claims?.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Access denied: Admin privileges required' });
            }

            const targetId = req.params.id;
            const newStatus = String(req.body?.status || '').toUpperCase();
            if (!identityEngine.ALLOWED_STATUSES.includes(newStatus)) {
                return res.status(400).json({
                    error: `Invalid status. Must be one of: ${identityEngine.ALLOWED_STATUSES.join(', ')}`
                });
            }

            if (targetId === req.identity.id) {
                return res.status(403).json({ error: 'Administrators cannot change their own account status.' });
            }

            const target = await identityEngine.findUserById(targetId);
            if (!target) return res.status(404).json({ error: 'User not found' });

            const isAdminTarget = (target.metadata || {}).role === 'ADMIN';
            if (isAdminTarget && newStatus !== 'ACTIVE') {
                const otherActiveAdmins = await identityEngine.countOtherActiveAdmins(targetId);
                if (otherActiveAdmins < 1) {
                    return res.status(409).json({
                        error: 'Cannot suspend or deactivate the last active Administrator account.'
                    });
                }
            }

            const updated = await identityEngine.setAccountStatus(targetId, newStatus);
            return res.json({ message: `Account status updated to ${newStatus}`, user: publicUser(updated) });
        } catch (err) {
            if (err.message === 'USER_NOT_FOUND') return res.status(404).json({ error: 'User not found' });
            return res.status(500).json({ error: err.message });
        }
    });

    router.patch('/users/:id/role', authenticateMiddleware, async (req, res) => {
        try {
            if (req.claims?.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Access denied: Admin privileges required' });
            }

            const targetId = req.params.id;
            const newRole = String(req.body?.role || '').toUpperCase();
            if (!identityEngine.ALLOWED_ROLES.includes(newRole)) {
                return res.status(400).json({
                    error: `Invalid role. Must be one of: ${identityEngine.ALLOWED_ROLES.join(', ')}`
                });
            }

            if (targetId === req.identity.id) {
                return res.status(403).json({ error: 'Administrators cannot change their own role.' });
            }

            const target = await identityEngine.findUserById(targetId);
            if (!target) return res.status(404).json({ error: 'User not found' });

            const isAdminTarget = (target.metadata || {}).role === 'ADMIN';
            if (isAdminTarget && newRole !== 'ADMIN') {
                const otherActiveAdmins = await identityEngine.countOtherActiveAdmins(targetId);
                if (otherActiveAdmins < 1) {
                    return res.status(409).json({
                        error: 'Cannot change the role of the last active Administrator account.'
                    });
                }
            }

            const updated = await identityEngine.setUserRole(targetId, newRole);
            return res.json({ message: `Role updated to ${newRole}`, user: publicUser(updated) });
        } catch (err) {
            if (err.message === 'USER_NOT_FOUND') return res.status(404).json({ error: 'User not found' });
            return res.status(500).json({ error: err.message });
        }
    });

    router.patch('/users/:id/district', authenticateMiddleware, async (req, res) => {
        try {
            if (req.claims?.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Access denied: Admin privileges required' });
            }

            const targetId = req.params.id;
            const district = String(req.body?.district || '').trim();
            if (!CANONICAL_DISTRICTS.includes(district)) {
                return res.status(400).json({
                    error: `Unknown district '${district}'. Must be one of the 18 NER districts.`
                });
            }

            const target = await identityEngine.findUserById(targetId);
            if (!target) return res.status(404).json({ error: 'User not found' });

            const updated = await identityEngine.setUserDistrict(targetId, district);
            return res.json({ message: `District updated to ${district}`, user: publicUser(updated) });
        } catch (err) {
            if (err.message === 'USER_NOT_FOUND') return res.status(404).json({ error: 'User not found' });
            return res.status(500).json({ error: err.message });
        }
    });

    return router;
};
