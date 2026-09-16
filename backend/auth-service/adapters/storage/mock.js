// In-memory mock storage adapter matching the exact contract
class MockStorageAdapter {
    constructor() {
        this.users = new Map();
        this.sessions = new Map();
        this.passwordResetTokens = new Map();
    }

    // IDENTITY CONTRACT
    async createUser(identifier, passwordHash, metadata = {}) {
        if (this.users.has(identifier)) throw new Error('User already exists');

        const id = `user_${Math.random().toString(36).substring(2, 9)}`;

        const user = {
            id,
            identifier,
            password_hash: passwordHash,
            is_active: true,
            metadata,
            created_at: new Date(),
            updated_at: new Date()
        };

        this.users.set(id, user);
        this.users.set(identifier, user);

        return user;
    }

    async findUserByIdentifier(identifier) {
        const user = this.users.get(identifier);
        return user || null;
    }

    async findUserById(id) {
        const user = this.users.get(id);
        return user || null;
    }

    async updatePassword(userId, newPasswordHash) {
        const user = this.users.get(userId);
        if (!user) throw new Error('User not found');

        user.password_hash = newPasswordHash;
        user.updated_at = new Date();

        this.users.set(user.id, user);
        this.users.set(user.identifier, user);

        return true;
    }

    async updateUserMetadata(userId, metadata) {
        const user = this.users.get(userId);
        if (!user) throw new Error('User not found');

        user.metadata = { ...(user.metadata || {}), ...metadata };
        user.updated_at = new Date();

        this.users.set(user.id, user);
        this.users.set(user.identifier, user);

        return user;
    }

    async setActive(userId, isActive) {
        const user = this.users.get(userId);
        if (!user) throw new Error('User not found');

        user.is_active = isActive;
        user.updated_at = new Date();

        this.users.set(user.id, user);
        this.users.set(user.identifier, user);

        return true;
    }

    async getAllUsers() {
        // createUser() stores each user under both its `id` and `identifier`
        // keys -- keep only the id-keyed entry so each account is returned once.
        const result = [];
        for (const [key, user] of this.users.entries()) {
            if (key === user.id) result.push({ ...user });
        }
        return result;
    }

    // SESSION CONTRACT
    async createSession(sessionData) {
        const session = {
            ...sessionData,
            revoked: false,
            created_at: new Date()
        };

        this.sessions.set(session.sessionId, session);
        return session;
    }

    async findSession(sessionId) {
        return this.sessions.get(sessionId) || null;
    }

    async updateSessionToken(sessionId, newRefreshTokenHash, expiresAt) {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        session.refreshTokenHash = newRefreshTokenHash;
        session.expiresAt = expiresAt;

        this.sessions.set(sessionId, session);
        return true;
    }

    async revokeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        session.revoked = true;
        this.sessions.set(sessionId, session);
        return true;
    }

    async deleteExpiredSessions() {
        let count = 0;
        const now = new Date();

        for (const [id, session] of this.sessions.entries()) {
            if (session.expiresAt < now) {
                this.sessions.delete(id);
                count++;
            }
        }

        return count;
    }

    // PASSWORD RESET CONTRACT
    async createPasswordResetToken(userId, tokenHash, expiresAt) {
        const id = `reset_${Math.random().toString(36).substring(2, 11)}`;
        const record = { id, userId, tokenHash, expiresAt, usedAt: null };
        this.passwordResetTokens.set(tokenHash, record);
        return record;
    }

    async findAndConsumePasswordResetToken(tokenHash) {
        const record = this.passwordResetTokens.get(tokenHash);
        if (!record || record.usedAt || record.expiresAt < new Date()) return null;
        record.usedAt = new Date();
        this.passwordResetTokens.set(tokenHash, record);
        return { userId: record.userId };
    }
}

module.exports = MockStorageAdapter;
