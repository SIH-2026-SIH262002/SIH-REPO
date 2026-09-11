// Canonical NER district list. Mirrors backend/app/graph_data.py's NODES
// district field so "district" means the same real place across the FastAPI
// gateway, the auth-service, and the Admin Console -- never a free-text value.
const CANONICAL_DISTRICTS = [
    'Kamrup Metro',
    'Ri-Bhoi',
    'East Khasi Hills',
    'West Jaintia Hills',
    'Sonitpur',
    'Papum Pare',
    'West Kameng',
    'Dima Hasao',
    'Cachar',
    'Aizawl',
    'Kohima',
    'Dimapur',
    'Imphal West',
    'West Tripura',
    'East Sikkim',
    'North Sikkim',
    'Lower Subansiri',
    'Karbi Anglong',
];

module.exports = { CANONICAL_DISTRICTS };
