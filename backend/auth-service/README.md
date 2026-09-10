# Auth Module – The Universal Authentication Engine

The **Auth Module** (`auth-engine`) is a deeply decoupled, plug-and-play authentication engine. It works for simple **single-role** apps or complex **multi-role, multi-tenant** platforms, and is designed to **integrate with other auth systems** (OAuth, SAML, custom IdPs) through a single, consistent API.

---

## Project structure

```
├── auth-engine/          # Backend auth engine
│   ├── core/             # Identity, Session, Token, Claims, Policy, PasswordReset, Events
│   ├── middleware/      # authenticate, authorize
│   ├── router/          # /auth routes
│   ├── adapters/storage/ # Mock, SQLite (add your own: Postgres, Mongo, Redis)
│   ├── db/               # Drizzle schema and connection (SQLite)
│   ├── server.js         # Demo server
│   └── .env.example
├── frontend/             # React + Vite demo UI
│   ├── src/
│   │   ├── lib/authApi.js  # API URL, token storage, refresh, logout
│   │   └── components/     # Login, Register, Forgot/Reset password, Dashboard
│   └── .env.example
└── README.md
```

---

## Architecture & core philosophy

Core responsibilities are split into separate modules:

1. **Identity Engine** – Password hashing, registration, user lookup.
2. **Session Engine** – Session IDs, refresh tokens, rotation (anti-replay), expiry.
3. **Token Engine** – JWT sign/verify, opaque refresh and reset tokens.
4. **Claims Engine** – Map user/session/context to roles, permissions, tenant.
5. **Policy Engine** – Boolean evaluation for “can this user do this?”.
6. **Password Reset** – Forgot-password flow (token generation, single-use consume).

### Storage adapter pattern

The engine does **not** assume a database. You inject a **Storage Adapter** that implements:

- **Identity**: `createUser`, `findUserByIdentifier`, `findUserById`, `updatePassword`
- **Sessions**: `createSession`, `findSession`, `updateSessionToken`, `revokeSession`, `deleteExpiredSessions`
- **Password reset** (optional): `createPasswordResetToken`, `findAndConsumePasswordResetToken`

Adapters are provided for **Mock** (in-memory) and **SQLite** (Drizzle). You can add Postgres, MongoDB, Redis, etc., without changing core logic.

---

## Getting started

### 1. Backend (auth-engine)

```bash
cd auth-engine
npm install
cp .env.example .env   # Edit with your JWT_SECRET and CORS_ORIGIN
npm run db:push        # Create/update SQLite tables (tenant_id, password_reset_tokens)
npm run dev
```

Server runs at `http://localhost:3000`. Env options: `PORT`, `CORS_ORIGIN`, `JWT_SECRET`, `ACCESS_EXPIRY`, `REFRESH_EXPIRY_MS`.

### 2. Frontend (demo)

```bash
cd frontend
npm install
cp .env.example .env   # Set VITE_API_URL=http://localhost:3000
npm run dev
```

Open `http://localhost:5173`. Use **Forgot password?** on login; in development the reset token is printed in the auth-engine console so you can paste it into the Reset Password form.

### 3. Initialize in your own project

```javascript
const express = require('express');
const Auth = require('./auth-engine/index');
const YourStorageAdapter = require('./your-adapter');

const app = express();
app.use(express.json());

const storageAdapter = new YourStorageAdapter();

const claimsResolver = async ({ userId, sessionId, context }) => {
    return { roles: ['user', 'admin'], tenant: context.tenant };
};

const policyResolver = async ({ policy, claims, context }) => {
    if (policy === 'adminOnly') return claims.roles.includes('admin');
    return true;
};

const authSystem = Auth.init({
    storageAdapter,
    claimsResolver,
    policyResolver,
    jwtSecret: process.env.JWT_SECRET,
    accessExpiry: '15m',
    refreshExpiryMs: 7 * 24 * 60 * 60 * 1000
});

app.use('/auth', authSystem.router);
```

---

## Protecting routes

- **Authenticate only** (any logged-in user):

```javascript
app.get('/api/profile', authSystem.authenticate, (req, res) => {
    res.json({ userId: req.identity.id, claims: req.claims });
});
```

- **Authenticate + authorize by policy**:

```javascript
app.delete('/api/admin/users', authSystem.authenticate, authSystem.authorize('adminOnly'), (req, res) => {
    res.json({ message: 'Done' });
});
```

---

## Forgot password & reset

1. **Request reset**  
   Client: `POST /auth/forgot-password` with `{ identifier }` (or `email`).  
   Server: If user exists, creates a short-lived reset token, then emits `PASSWORD_RESET_REQUESTED` with `{ userId, identifier, rawToken, expiresAt }`. Your app should send an email with a link containing the token (e.g. `https://yourapp.com/reset?token=...`).

2. **Reset password**  
   Client: `POST /auth/reset-password` with `{ token, newPassword }`.  
   Server: Validates token (single-use), updates password, emits `PASSWORD_RESET_COMPLETED`.

**Handling the event (e.g. send email):**

```javascript
authSystem.onPasswordResetRequested(({ identifier, rawToken, expiresAt }) => {
    const resetLink = `https://yourapp.com/reset?token=${rawToken}`;
    await sendEmail(identifier, 'Reset your password', resetLink);
});
```

In development, the demo server logs the reset token to the console so you can test without email.

---

## Integrating with other auth systems (universal / adaptive)

To keep one consistent auth surface (JWT + session) while supporting external IdPs (OAuth, SAML, etc.):

1. Implement an **external auth resolver** that, given a provider and token (and optional profile), validates the token with the external system and returns your internal user id (and optionally creates/links the user).
2. Pass it into `Auth.init` as `externalAuthResolver`.
3. Clients call `POST /auth/external` with `{ provider, token, profile? }` and receive the same `accessToken`, `refreshToken`, `sessionId` as with local login.

Example:

```javascript
const externalAuthResolver = async ({ provider, token, profile, req }) => {
    if (provider === 'google') {
        const payload = await verifyGoogleToken(token);  // your OAuth verification
        let user = await storageAdapter.findUserByIdentifier(payload.email);
        if (!user) {
            user = await storageAdapter.createUser(payload.email, '', { name: payload.name });
        }
        return { userId: user.id };
    }
    return null;
};

const authSystem = Auth.init({
    storageAdapter,
    claimsResolver,
    policyResolver,
    jwtSecret: process.env.JWT_SECRET,
    externalAuthResolver
});
```

After that, the rest of your app uses `authSystem.authenticate` and `authSystem.authorize` the same way for both local and external logins.

---

## Event-driven hooks

```javascript
authSystem.onLoginSuccess(({ userId, sessionId }) => { /* ... */ });
authSystem.onLoginFailure(({ identifier, reason }) => { /* ... */ });
authSystem.onSessionCreated(({ sessionId, userId, tenantId }) => { /* ... */ });
authSystem.onSessionRevoked(({ sessionId, userId }) => { /* ... */ });
authSystem.onTokenRefresh(({ sessionId, userId }) => { /* ... */ });
authSystem.onPolicyDenied(({ userId, policy, route }) => { /* ... */ });
authSystem.onPasswordResetRequested(({ userId, identifier, rawToken, expiresAt }) => { /* send email */ });
authSystem.onPasswordResetCompleted(() => { /* ... */ });
```

---

## API reference (`/auth`)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/auth/register` (Admin Only) | `{ email?, identifier, password, metadata? }` | `{ userId }` (Public disabled; requires Admin JWT) |
| POST | `/auth/login` | `{ email?, identifier, password }` | `{ accessToken, refreshToken, sessionId, expiresIn }` |
| POST | `/auth/refresh` | `{ refreshToken, sessionId }` | `{ accessToken, refreshToken, sessionId }` |
| POST | `/auth/logout` | `{ sessionId }` | `{ message }` |
| POST | `/auth/forgot-password` | `{ email?, identifier }` | `{ message }` (always 200) |
| POST | `/auth/reset-password` | `{ token, newPassword }` | `{ message }` |
| POST | `/auth/external` | `{ provider, token, profile? }` | Same as login (only if `externalAuthResolver` is set) |

Client should store `accessToken`, `refreshToken`, and `sessionId` (e.g. in memory or localStorage). Use `sessionId` for refresh and logout. On 401, call `/auth/refresh` with `refreshToken` and `sessionId`, then retry the request with the new access token.

---

## Options

- **trustJwtClaims** (default `false`): If `true`, claims are read from the JWT payload instead of resolving on every request (faster, but role changes apply only after re-login or refresh).

---

## License

ISC.
