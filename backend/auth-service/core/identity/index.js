const bcrypt = require('bcryptjs');

// Canonical 5-role model (docs/architecture/ROLE_MODEL.md). SUPER_ADMIN and
// DISTRICT_AUTHORITY are legacy aliases normalized elsewhere -- never valid
// values to assign directly.
const ALLOWED_ROLES = ['ADMIN', 'EMERGENCY_OPERATOR', 'LOGISTICS_OPERATOR', 'FIELD_OFFICER', 'DRIVER'];
// The `users.is_active` column is a fast boolean flag; `metadata.accountStatus`
// carries the full three-state lifecycle. The two are always kept in sync
// (is_active = accountStatus === 'ACTIVE') so any code that only checks the
// column (e.g. the refresh-token flow) still behaves correctly.
const ALLOWED_STATUSES = ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'];

let storageAdapter = null;

const __init__ = (injectedAdapter) => {
    if (!injectedAdapter) throw new Error("Storage adapter is required");
    storageAdapter = injectedAdapter;
};

// Hashes a plain text password (Async)
const hashPassword = async (password) => {
    // We are using bcrypt as the secure fallback as requested, argon2 requires node-gyp builds
    // which may complicate the "adapt to any project" requirement out of the box.
    const saltRounds = 12; // Sufficient secure default
    return await bcrypt.hash(password, saltRounds);
};

const createUser = async ({ identifier, password, metadata = {} }) => {
    if (!storageAdapter) throw new Error("Identity layer not initialized with storage adapter");
    if (!identifier || !password) throw new Error("Identifier and password are required");

    const existingUser = await storageAdapter.findUserByIdentifier(identifier);
    if (existingUser) {
        throw new Error('IDENTIFIER_IN_USE');
    }

    const passwordHash = await hashPassword(password);

    // Call the injected storage adapter
    return await storageAdapter.createUser(identifier, passwordHash, metadata);
};

const findUserByIdentifier = async (identifier) => {
    if (!storageAdapter) throw new Error("Identity layer not initialized");
    return await storageAdapter.findUserByIdentifier(identifier);
};

const findUserById = async (id) => {
    if (!storageAdapter) throw new Error("Identity layer not initialized");
    return await storageAdapter.findUserById(id);
};

const verifyPassword = async (user, plainTextPassword) => {
    if (!user || !user.password_hash) return false;
    return await bcrypt.compare(plainTextPassword, user.password_hash);
};

const changePassword = async (userId, currentPassword, newPassword) => {
    if (!storageAdapter) throw new Error("Identity layer not initialized");
    const user = await storageAdapter.findUserById(userId);
    if (!user) throw new Error("USER_NOT_FOUND");
    const isValid = await verifyPassword(user, currentPassword);
    if (!isValid) throw new Error("INVALID_CURRENT_PASSWORD");
    const newHash = await hashPassword(newPassword);
    return await storageAdapter.updatePassword(userId, newHash);
};

const updateUserMetadata = async (userId, metadata) => {
    if (!storageAdapter) throw new Error("Identity layer not initialized");
    return await storageAdapter.updateUserMetadata(userId, metadata);
};

const getAllUsers = async () => {
    if (!storageAdapter) throw new Error("Identity layer not initialized");
    return await storageAdapter.getAllUsers();
};

// --- Admin account lifecycle (docs/architecture/PERMISSIONS.md: USER_SUSPEND,
// USER_REACTIVATE, USER_DEACTIVATE, ROLE_MANAGE -- all ADMIN-only, GLOBAL scope) ---

const deriveAccountStatus = (user) => {
    const meta = user?.metadata || {};
    return meta.accountStatus || (user?.is_active ? 'ACTIVE' : 'SUSPENDED');
};

const setAccountStatus = async (userId, status) => {
    if (!storageAdapter) throw new Error("Identity layer not initialized");
    if (!ALLOWED_STATUSES.includes(status)) throw new Error('INVALID_STATUS');
    const user = await storageAdapter.findUserById(userId);
    if (!user) throw new Error('USER_NOT_FOUND');
    await storageAdapter.setActive(userId, status === 'ACTIVE');
    return await storageAdapter.updateUserMetadata(userId, { accountStatus: status });
};

const setUserRole = async (userId, role) => {
    if (!storageAdapter) throw new Error("Identity layer not initialized");
    if (!ALLOWED_ROLES.includes(role)) throw new Error('INVALID_ROLE');
    const user = await storageAdapter.findUserById(userId);
    if (!user) throw new Error('USER_NOT_FOUND');
    return await storageAdapter.updateUserMetadata(userId, { role });
};

const setUserDistrict = async (userId, district) => {
    if (!storageAdapter) throw new Error("Identity layer not initialized");
    const user = await storageAdapter.findUserById(userId);
    if (!user) throw new Error('USER_NOT_FOUND');
    return await storageAdapter.updateUserMetadata(userId, { district });
};

// Used to enforce "cannot suspend/deactivate/re-role the last active
// Administrator" -- counts ACTIVE admins other than the one being acted on.
const countOtherActiveAdmins = async (excludeUserId) => {
    if (!storageAdapter) throw new Error("Identity layer not initialized");
    const all = await storageAdapter.getAllUsers();
    return all.filter((u) => {
        if (u.id === excludeUserId) return false;
        const meta = u.metadata || {};
        return meta.role === 'ADMIN' && deriveAccountStatus(u) === 'ACTIVE';
    }).length;
};

// Export identity functions
module.exports = {
    __init__,
    createUser,
    findUserByIdentifier,
    findUserById,
    verifyPassword,
    hashPassword,
    changePassword,
    updateUserMetadata,
    getAllUsers,
    deriveAccountStatus,
    setAccountStatus,
    setUserRole,
    setUserDistrict,
    countOtherActiveAdmins,
    ALLOWED_ROLES,
    ALLOWED_STATUSES
};
