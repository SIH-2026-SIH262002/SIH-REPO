/**
 * Seeds demo accounts for each app role, since public self-registration is
 * disabled (ALLOW_PUBLIC_REGISTRATION=false) and there's no other way to get
 * a first account into a fresh Neon database. Run once per environment:
 *
 *   node scripts/seed-demo-users.js
 *
 * Safe to re-run: existing identifiers are skipped, not overwritten.
 */
require('dotenv').config();
const identityEngine = require('../core/identity');
const SqliteStorageAdapter = require('../adapters/storage/sqlite');

identityEngine.__init__(new SqliteStorageAdapter());

const DEMO_PASSWORD = 'password123';

const DEMO_USERS = [
    {
        identifier: 'officer@nerlogisense.gov.in',
        fullName: 'Demo Field Officer',
        role: 'FIELD_OFFICER',
        district: 'East Khasi Hills',
        organization: 'NER Logistics & Disaster Mgmt Authority',
    },
    {
        identifier: 'driver@nerlogisense.gov.in',
        fullName: 'Demo Driver',
        role: 'DRIVER',
        district: 'Kamrup Metro',
        organization: 'NER Logistics & Disaster Mgmt Authority',
    },
    {
        identifier: 'localuser@nerlogisense.gov.in',
        fullName: 'Demo Local User',
        role: 'LOCAL_USER',
        district: 'Shillong',
        organization: '',
    },
    {
        identifier: 'admin@nerlogisense.gov.in',
        fullName: 'Demo Admin',
        role: 'ADMIN',
        district: '',
        organization: 'NER Logistics & Disaster Mgmt Authority',
    },
];

(async () => {
    for (const demo of DEMO_USERS) {
        try {
            await identityEngine.createUser({
                identifier: demo.identifier,
                password: DEMO_PASSWORD,
                metadata: {
                    fullName: demo.fullName,
                    email: demo.identifier,
                    phone: '',
                    role: demo.role,
                    organization: demo.organization,
                    district: demo.district,
                },
            });
            console.log(`Created ${demo.role}: ${demo.identifier} / ${DEMO_PASSWORD}`);
        } catch (err) {
            if (err.message === 'IDENTIFIER_IN_USE') {
                console.log(`Skipped (already exists): ${demo.identifier}`);
            } else {
                console.error(`Failed to create ${demo.identifier}:`, err.message);
            }
        }
    }
    process.exit(0);
})();
