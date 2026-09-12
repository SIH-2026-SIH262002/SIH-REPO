const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const schema = require('./schema');

// Pooled connection: safe for per-request app traffic (serverless-friendly).
const sql = neon(process.env.DATABASE_URL);

// Attach Drizzle ORM
const db = drizzle(sql, { schema });

module.exports = {
    db
};
