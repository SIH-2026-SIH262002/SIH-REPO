const { pgTable, text, boolean, timestamp } = require('drizzle-orm/pg-core');

// Define the users table
const users = pgTable('users', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull().unique(), // Can be email, username, phone, etc.
    password_hash: text('password_hash').notNull(),
    is_active: boolean('is_active').notNull().default(true),
    metadata: text('metadata').default('{}'),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Define the sessions table
const sessions = pgTable('sessions', {
    sessionId: text('session_id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    tenantId: text('tenant_id'),
    expiresAt: timestamp('expires_at').notNull(),
    revoked: boolean('revoked').notNull().default(false),
    created_at: timestamp('created_at').notNull().defaultNow(),
});

// Password reset tokens (single-use, short-lived)
const passwordResetTokens = pgTable('password_reset_tokens', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    created_at: timestamp('created_at').notNull().defaultNow(),
});

module.exports = {
    users,
    sessions,
    passwordResetTokens
};
