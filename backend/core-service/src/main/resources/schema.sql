-- PostGIS Spatial Indexing & Partitioning Schema Optimization
-- Addresses Architecture Review Item #10: Prevents PostGIS choke points during high-frequency telemetry ingest.

-- Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Vehicle Telemetry Spatial Table with GiST Indexing
CREATE TABLE IF NOT EXISTS vehicle_telemetry (
    id BIGSERIAL PRIMARY KEY,
    vehicle_code VARCHAR(64) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    geom GEOMETRY(Point, 4326),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GiST Spatial Index for high-performance ST_DWithin and bounding box queries
CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_geom ON vehicle_telemetry USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_code_time ON vehicle_telemetry(vehicle_code, recorded_at DESC);

-- Incident Polygons Spatial Index
CREATE TABLE IF NOT EXISTS spatial_incidents (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    geom GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_spatial_incidents_geom ON spatial_incidents USING GIST(geom);
