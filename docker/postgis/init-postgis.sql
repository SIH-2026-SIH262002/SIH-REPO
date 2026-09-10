-- ============================================================================
-- NER LOGISENSE — POSTGIS SPATIAL GIS & WAREHOUSE INVENTORY INITIALIZATION
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgrouting;

-- 1. Sensor Nodes Spatial Table
CREATE TABLE IF NOT EXISTS sensor_nodes (
    id SERIAL PRIMARY KEY,
    sensor_node_id VARCHAR(20) UNIQUE NOT NULL,
    node_key VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    elevation_m DOUBLE PRECISION DEFAULT 100.0,
    geom GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sensor_nodes_geom ON sensor_nodes USING GIST(geom);

-- 2. NHAI Highway Corridors Spatial LineString Table
CREATE TABLE IF NOT EXISTS road_corridors (
    id SERIAL PRIMARY KEY,
    corridor_key VARCHAR(50) UNIQUE NOT NULL,
    highway_ref VARCHAR(30) NOT NULL,
    origin_key VARCHAR(10) NOT NULL REFERENCES sensor_nodes(node_key),
    destination_key VARCHAR(10) NOT NULL REFERENCES sensor_nodes(node_key),
    distance_km DOUBLE PRECISION NOT NULL,
    base_time_hr DOUBLE PRECISION NOT NULL,
    current_risk_score DOUBLE PRECISION DEFAULT 10.0,
    category VARCHAR(20) DEFAULT 'LOW',
    geom GEOMETRY(LineString, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_road_corridors_geom ON road_corridors USING GIST(geom);

-- 3. Warehouse Inventory Feed Table
CREATE TABLE IF NOT EXISTS warehouse_inventory (
    id SERIAL PRIMARY KEY,
    warehouse_code VARCHAR(30) UNIQUE NOT NULL,
    warehouse_name VARCHAR(120) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    commodity_type VARCHAR(100) NOT NULL,
    stock_quantity DOUBLE PRECISION NOT NULL,
    unit VARCHAR(30) NOT NULL,
    reorder_threshold DOUBLE PRECISION NOT NULL,
    consumption_rate_per_hr DOUBLE PRECISION NOT NULL,
    status VARCHAR(30) DEFAULT 'OPERATIONAL',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    geom GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_warehouse_geom ON warehouse_inventory USING GIST(geom);

-- ============================================================================
-- SEED DATA: 18 NER SENSOR NODES (POSTGIS GEOMETRY POINTS)
-- ============================================================================
INSERT INTO sensor_nodes (sensor_node_id, node_key, name, district, state, elevation_m, geom) VALUES
('NER-A01', 'GHY', 'Guwahati', 'Kamrup Metro', 'Assam', 55.0, ST_SetSRID(ST_MakePoint(91.7362, 26.1445), 4326)),
('NER-A02', 'NGP', 'Nongpoh', 'Ri-Bhoi', 'Meghalaya', 485.0, ST_SetSRID(ST_MakePoint(91.8800, 25.9000), 4326)),
('NER-A03', 'SHL', 'Shillong', 'East Khasi Hills', 'Meghalaya', 1525.0, ST_SetSRID(ST_MakePoint(91.8933, 25.5788), 4326)),
('NER-A04', 'JNT', 'Jowai', 'West Jaintia Hills', 'Meghalaya', 1380.0, ST_SetSRID(ST_MakePoint(92.3500, 25.4300), 4326)),
('NER-A05', 'TEZ', 'Tezpur', 'Sonitpur', 'Assam', 48.0, ST_SetSRID(ST_MakePoint(92.8000, 26.6300), 4326)),
('NER-A06', 'ITN', 'Itanagar', 'Papum Pare', 'Arunachal Pradesh', 320.0, ST_SetSRID(ST_MakePoint(93.6200, 27.1000), 4326)),
('NER-A07', 'BOM', 'Bomdila', 'West Kameng', 'Arunachal Pradesh', 2415.0, ST_SetSRID(ST_MakePoint(92.4000, 27.2900), 4326)),
('NER-A08', 'HAF', 'Haflong', 'Dima Hasao', 'Assam', 966.0, ST_SetSRID(ST_MakePoint(93.0200, 25.4800), 4326)),
('NER-A09', 'SLC', 'Silchar', 'Cachar', 'Assam', 35.0, ST_SetSRID(ST_MakePoint(92.7800, 24.8300), 4326)),
('NER-A10', 'AIZ', 'Aizawl', 'Aizawl', 'Mizoram', 1132.0, ST_SetSRID(ST_MakePoint(92.7176, 23.7271), 4326)),
('NER-A11', 'KOH', 'Kohima', 'Kohima', 'Nagaland', 1444.0, ST_SetSRID(ST_MakePoint(94.1086, 25.6751), 4326)),
('NER-A12', 'DMP', 'Dimapur', 'Dimapur', 'Nagaland', 145.0, ST_SetSRID(ST_MakePoint(93.7267, 25.9091), 4326)),
('NER-A13', 'IMP', 'Imphal', 'Imphal West', 'Manipur', 786.0, ST_SetSRID(ST_MakePoint(93.9368, 24.8170), 4326)),
('NER-A14', 'AGT', 'Agartala', 'West Tripura', 'Tripura', 12.0, ST_SetSRID(ST_MakePoint(91.2868, 23.8315), 4326)),
('NER-A15', 'GTK', 'Gangtok', 'East Sikkim', 'Sikkim', 1650.0, ST_SetSRID(ST_MakePoint(88.6065, 27.3389), 4326)),
('NER-A16', 'MNG', 'Mangan', 'North Sikkim', 'Sikkim', 1310.0, ST_SetSRID(ST_MakePoint(88.5700, 27.7200), 4326)),
('NER-A17', 'ZRO', 'Ziro', 'Lower Subansiri', 'Arunachal Pradesh', 1688.0, ST_SetSRID(ST_MakePoint(93.8300, 27.1000), 4326)),
('NER-A18', 'DPH', 'Diphu', 'Karbi Anglong', 'Assam', 186.0, ST_SetSRID(ST_MakePoint(93.4400, 25.8500), 4326))
ON CONFLICT (node_key) DO UPDATE SET
    name = EXCLUDED.name,
    district = EXCLUDED.district,
    state = EXCLUDED.state,
    geom = EXCLUDED.geom;

-- ============================================================================
-- SEED DATA: 20 NHAI HIGHWAY CORRIDORS (POSTGIS LINESTRING GEOMETRIES)
-- ============================================================================
INSERT INTO road_corridors (corridor_key, highway_ref, origin_key, destination_key, distance_km, base_time_hr, current_risk_score, geom) VALUES
('NH-6_GHY_NGP', 'NH-6', 'GHY', 'NGP', 60.0, 1.5, 12.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(91.7362, 26.1445), ST_MakePoint(91.8800, 25.9000)), 4326)),
('NH-6_NGP_SHL', 'NH-6', 'NGP', 'SHL', 40.0, 1.2, 18.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(91.8800, 25.9000), ST_MakePoint(91.8933, 25.5788)), 4326)),
('NH-6_SHL_JNT', 'NH-6', 'SHL', 'JNT', 65.0, 1.8, 25.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(91.8933, 25.5788), ST_MakePoint(92.3500, 25.4300)), 4326)),
('NH-6_JNT_SLC', 'NH-6', 'JNT', 'SLC', 150.0, 4.0, 78.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(92.3500, 25.4300), ST_MakePoint(92.7800, 24.8300)), 4326)),
('NH-15_GHY_TEZ', 'NH-15', 'GHY', 'TEZ', 175.0, 4.0, 15.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(91.7362, 26.1445), ST_MakePoint(92.8000, 26.6300)), 4326)),
('NH-13_TEZ_BOM', 'NH-13', 'TEZ', 'BOM', 140.0, 4.5, 42.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(92.8000, 26.6300), ST_MakePoint(92.4000, 27.2900)), 4326)),
('NH-13_BOM_ITN', 'NH-13', 'BOM', 'ITN', 120.0, 4.0, 38.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(92.4000, 27.2900), ST_MakePoint(93.6200, 27.1000)), 4326)),
('NH-15_TEZ_ITN', 'NH-15', 'TEZ', 'ITN', 155.0, 3.5, 20.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(92.8000, 26.6300), ST_MakePoint(93.6200, 27.1000)), 4326)),
('NH-13_ITN_ZRO', 'NH-13', 'ITN', 'ZRO', 115.0, 3.5, 52.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(93.6200, 27.1000), ST_MakePoint(93.8300, 27.1000)), 4326)),
('NH-27_GHY_DPH', 'NH-27', 'GHY', 'DPH', 215.0, 5.0, 14.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(91.7362, 26.1445), ST_MakePoint(93.4400, 25.8500)), 4326)),
('NH-13_DPH_ZRO', 'NH-13', 'DPH', 'ZRO', 140.0, 4.0, 48.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(93.4400, 25.8500), ST_MakePoint(93.8300, 27.1000)), 4326)),
('NH-27_DPH_DMP', 'NH-27', 'DPH', 'DMP', 75.0, 2.0, 22.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(93.4400, 25.8500), ST_MakePoint(93.7267, 25.9091)), 4326)),
('NH-29_DMP_KOH', 'NH-29', 'DMP', 'KOH', 75.0, 2.5, 62.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(93.7267, 25.9091), ST_MakePoint(94.1086, 25.6751)), 4326)),
('NH-2_KOH_IMP', 'NH-2', 'KOH', 'IMP', 140.0, 4.0, 45.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(94.1086, 25.6751), ST_MakePoint(93.9368, 24.8170)), 4326)),
('NH-27_DPH_HAF', 'NH-27', 'DPH', 'HAF', 150.0, 4.5, 68.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(93.4400, 25.8500), ST_MakePoint(93.0200, 25.4800)), 4326)),
('NH-27_HAF_SLC', 'NH-27', 'HAF', 'SLC', 90.0, 2.5, 88.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(93.0200, 25.4800), ST_MakePoint(92.7800, 24.8300)), 4326)),
('NH-306_SLC_AIZ', 'NH-306', 'SLC', 'AIZ', 180.0, 5.0, 58.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(92.7800, 24.8300), ST_MakePoint(92.7176, 23.7271)), 4326)),
('NH-8_SLC_AGT', 'NH-8', 'SLC', 'AGT', 220.0, 5.5, 32.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(92.7800, 24.8300), ST_MakePoint(91.2868, 23.8315)), 4326)),
('NH-10_GHY_GTK', 'NH-10', 'GHY', 'GTK', 220.0, 6.0, 40.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(91.7362, 26.1445), ST_MakePoint(88.6065, 27.3389)), 4326)),
('NH-310_GTK_MNG', 'NH-310', 'GTK', 'MNG', 65.0, 2.5, 75.0, ST_SetSRID(ST_MakeLine(ST_MakePoint(88.6065, 27.3389), ST_MakePoint(88.5700, 27.7200)), 4326))
ON CONFLICT (corridor_key) DO UPDATE SET
    current_risk_score = EXCLUDED.current_risk_score,
    geom = EXCLUDED.geom;

-- ============================================================================
-- SEED DATA: REGIONAL WAREHOUSE INVENTORY FEEDS
-- ============================================================================
INSERT INTO warehouse_inventory (warehouse_code, warehouse_name, district, state, commodity_type, stock_quantity, unit, reorder_threshold, consumption_rate_per_hr, status, geom) VALUES
('WH-GHY-01', 'Guwahati Central Logistics Depot', 'Kamrup Metro', 'Assam', 'MEDICAL_SUPPLIES', 1250.0, 'Boxes', 200.0, 15.5, 'CONNECTED_LIVE', ST_SetSRID(ST_MakePoint(91.7362, 26.1445), 4326)),
('WH-GHY-02', 'Guwahati Regional Grain Reserve', 'Kamrup Metro', 'Assam', 'RICE_GRAIN', 5400.0, 'Quintals', 1000.0, 42.0, 'CONNECTED_LIVE', ST_SetSRID(ST_MakePoint(91.7400, 26.1500), 4326)),
('WH-HAF-01', 'Dima Hasao Civil Hospital Depot', 'Dima Hasao', 'Assam', 'OXYGEN_CYLINDERS', 45.0, 'Cylinders', 30.0, 2.5, 'CONNECTED_LIVE', ST_SetSRID(ST_MakePoint(93.0200, 25.4800), 4326)),
('WH-SLC-01', 'Silchar Medical College Depot', 'Cachar', 'Assam', 'EMERGENCY_MEDICINES', 180.0, 'Kits', 50.0, 4.2, 'CONNECTED_LIVE', ST_SetSRID(ST_MakePoint(92.7800, 24.8300), 4326)),
('WH-SHL-01', 'Shillong State Vaccine Hub', 'East Khasi Hills', 'Meghalaya', 'COLD_CHAIN_VACCINES', 850.0, 'Vials', 150.0, 12.0, 'CONNECTED_LIVE', ST_SetSRID(ST_MakePoint(91.8933, 25.5788), 4326)),
('WH-IMP-01', 'Imphal Food Security Warehouse', 'Imphal West', 'Manipur', 'BABY_FOOD_FORMULA', 320.0, 'Cartons', 80.0, 3.8, 'CONNECTED_LIVE', ST_SetSRID(ST_MakePoint(93.9368, 24.8170), 4326)),
('WH-KOH-01', 'Kohima Disaster Relief Store', 'Kohima', 'Nagaland', 'TARPAULINS_TENTS', 620.0, 'Units', 100.0, 5.0, 'CONNECTED_LIVE', ST_SetSRID(ST_MakePoint(94.1086, 25.6751), 4326)),
('WH-AIZ-01', 'Aizawl Emergency Fuel Reserve', 'Aizawl', 'Mizoram', 'DIESEL_FUEL', 18500.0, 'Liters', 4000.0, 250.0, 'CONNECTED_LIVE', ST_SetSRID(ST_MakePoint(92.7176, 23.7271), 4326)),
('WH-ITN-01', 'Itanagar Essential Supplies Hub', 'Papum Pare', 'Arunachal Pradesh', 'DRY_RATIONS', 980.0, 'Packs', 200.0, 18.0, 'CONNECTED_LIVE', ST_SetSRID(ST_MakePoint(93.6200, 27.1000), 4326)),
('WH-GTK-01', 'Gangtok High Altitude Depot', 'East Sikkim', 'Sikkim', 'HEATING_FUEL', 4200.0, 'Liters', 800.0, 65.0, 'CONNECTED_LIVE', ST_SetSRID(ST_MakePoint(88.6065, 27.3389), 4326))
ON CONFLICT (warehouse_code) DO UPDATE SET
    stock_quantity = EXCLUDED.stock_quantity,
    status = EXCLUDED.status,
    last_updated = CURRENT_TIMESTAMP;
