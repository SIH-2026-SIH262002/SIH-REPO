import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    schema: "./db/schema.js",
    out: "./drizzle",
    dbCredentials: {
        // Direct (non-pooled) connection required for migrations.
        url: process.env.DATABASE_URL_UNPOOLED,
    }
});
