const { db } = require('../../db');
const { users, sessions, passwordResetTokens } = require('../../db/schema');
const { eq, lt, or, sql, and } = require('drizzle-orm');

class SqliteStorageAdapter {

    // IDENTITY CONTRACT //

    async createUser(identifier, passwordHash, metadata = {}) {
        const id = `user_${Math.random().toString(36).substring(2, 9)}`;

        try {
            const meta = typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {});
            const newUser = await db.insert(users).values({
                id,
                identifier,
                password_hash: passwordHash,
                metadata: meta
            }).returning();

            return {
                ...newUser[0],
                metadata: typeof newUser[0].metadata === 'string' ? JSON.parse(newUser[0].metadata) : newUser[0].metadata
            };
        } catch (error) {
            if (error.code === '23505') { // Postgres unique_violation
                throw new Error('User already exists');
            }
            throw error;
        }
    }

    async findUserByIdentifier(identifier) {
        // Universal search: check the primary identifier column OR the metadata JSON for email/phone
        const user = await db.select().from(users).where(
            or(
                eq(users.identifier, identifier),
                sql`(${users.metadata})::jsonb ->> 'email' = ${identifier}`,
                sql`(${users.metadata})::jsonb ->> 'phone' = ${identifier}`
            )
        ).limit(1);

        if (user.length === 0) return null;

        return {
            ...user[0],
            metadata: typeof user[0].metadata === 'string' ? JSON.parse(user[0].metadata) : user[0].metadata
        };
    }

    async findUserById(id) {
        const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
        if (user.length === 0) return null;

        return {
            ...user[0],
            metadata: typeof user[0].metadata === 'string' ? JSON.parse(user[0].metadata) : user[0].metadata
        };
    }

    async updatePassword(userId, newPasswordHash) {
        const result = await db.update(users)
            .set({ password_hash: newPasswordHash, updated_at: new Date() })
            .where(eq(users.id, userId))
            .returning({ updatedId: users.id });

        if (result.length === 0) throw new Error('User not found');
        return true;
    }

    async updateUserMetadata(userId, metadata) {
        const user = await this.findUserById(userId);
        if (!user) throw new Error('User not found');

        const updatedMeta = {
            ...user.metadata,
            ...metadata
        };

        const metaStr = JSON.stringify(updatedMeta);
        const result = await db.update(users)
            .set({ metadata: metaStr, updated_at: new Date() })
            .where(eq(users.id, userId))
            .returning();

        if (result.length === 0) throw new Error('User not found');
        return {
            ...result[0],
            metadata: updatedMeta
        };
    }

    async getAllUsers() {
        const allUsers = await db.select().from(users);
        return allUsers.map(u => ({
            id: u.id,
            identifier: u.identifier,
            is_active: u.is_active,
            metadata: typeof u.metadata === 'string' ? JSON.parse(u.metadata || '{}') : u.metadata,
            created_at: u.created_at,
            updated_at: u.updated_at
        }));
    }

    // SESSION CONTRACT //

    async createSession({ sessionId, userId, refreshTokenHash, tenantId, expiresAt }) {
        const newSession = await db.insert(sessions).values({
            sessionId,
            userId,
            refreshTokenHash,
            tenantId: tenantId || null,
            expiresAt
        }).returning();

        const row = newSession[0];
        return row ? { ...row, tenantId: row.tenantId ?? null } : null;
    }

    async findSession(sessionId) {
        const session = await db.select().from(sessions).where(eq(sessions.sessionId, sessionId)).limit(1);
        if (session.length === 0) return null;
        const row = session[0];
        return { ...row, tenantId: row.tenantId ?? null };
    }

    async updateSessionToken(sessionId, newRefreshTokenHash, expiresAt) {
        const result = await db.update(sessions)
            .set({ refreshTokenHash: newRefreshTokenHash, expiresAt })
            .where(eq(sessions.sessionId, sessionId))
            .returning({ updatedId: sessions.sessionId });

        if (result.length === 0) throw new Error('Session not found');
        return true;
    }

    async revokeSession(sessionId) {
        const result = await db.update(sessions)
            .set({ revoked: true })
            .where(eq(sessions.sessionId, sessionId))
            .returning({ updatedId: sessions.sessionId });

        if (result.length === 0) throw new Error('Session not found');
        return true;
    }

    async deleteExpiredSessions() {
        const now = new Date();
        const deleted = await db.delete(sessions)
            .where(lt(sessions.expiresAt, now))
            .returning();
        return deleted.length;
    }

    // PASSWORD RESET CONTRACT (optional – adapters can no-op if not supported)

    async createPasswordResetToken(userId, tokenHash, expiresAt) {
        const id = `reset_${Math.random().toString(36).substring(2, 11)}`;
        await db.insert(passwordResetTokens).values({
            id,
            userId,
            tokenHash,
            expiresAt
        });
        return { id, userId, tokenHash, expiresAt };
    }

    async findAndConsumePasswordResetToken(tokenHash) {
        const now = new Date();
        const rows = await db.select().from(passwordResetTokens).where(
            and(
                eq(passwordResetTokens.tokenHash, tokenHash),
                lt(now, passwordResetTokens.expiresAt),
                sql`${passwordResetTokens.usedAt} IS NULL`
            )
        ).limit(1);

        if (rows.length === 0) return null;
        const row = rows[0];
        await db.update(passwordResetTokens)
            .set({ usedAt: now })
            .where(eq(passwordResetTokens.id, row.id));
        return { userId: row.userId };
    }
}

module.exports = SqliteStorageAdapter;
