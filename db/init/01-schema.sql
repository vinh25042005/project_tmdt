-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Drop existing tables
DROP VIEW IF EXISTS v_provinces_market CASCADE;
DROP VIEW IF EXISTS v_districts CASCADE;
DROP VIEW IF EXISTS v_wards CASCADE;
DROP TABLE IF EXISTS admin_wards CASCADE;
DROP TABLE IF EXISTS admin_districts CASCADE;
DROP TABLE IF EXISTS admin_provinces CASCADE;
DROP TABLE IF EXISTS admin_country CASCADE;
DROP TABLE IF EXISTS province_economics CASCADE;
DROP TABLE IF EXISTS province_demographics CASCADE;

-- Demographic data
CREATE TABLE province_demographics (
    province_code VARCHAR(20) PRIMARY KEY,
    province_name VARCHAR(255) NOT NULL,
    ascii_name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    population BIGINT NOT NULL,
    area_km2 NUMERIC(12, 2) NOT NULL,
    population_density NUMERIC(12, 2) NOT NULL,
    urban_pct NUMERIC(5, 2) NOT NULL,
    median_age NUMERIC(4, 1) DEFAULT 32.5,
    household_count BIGINT NOT NULL
);

-- Economic & Market data
CREATE TABLE province_economics (
    province_code VARCHAR(20) PRIMARY KEY,
    province_name VARCHAR(255) NOT NULL,
    ascii_name VARCHAR(255) NOT NULL,
    gdp_billion_vnd NUMERIC(14, 2) NOT NULL,
    per_capita_income_million_vnd NUMERIC(6, 2) NOT NULL,
    retail_sales_billion_vnd NUMERIC(14, 2) NOT NULL,
    ecommerce_index NUMERIC(5, 2) NOT NULL,
    internet_penetration_pct NUMERIC(5, 2) NOT NULL,
    smartphone_penetration_pct NUMERIC(5, 2) NOT NULL
);

-- Admin Level 0: Country
CREATE TABLE admin_country (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) DEFAULT 'Việt Nam',
    geom GEOMETRY(MultiPolygon, 4326)
);

-- Admin Level 1: Provinces & Centrally-run Cities
CREATE TABLE admin_provinces (
    id SERIAL PRIMARY KEY,
    province_code VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    name_vi VARCHAR(255),
    note VARCHAR(255),
    geom GEOMETRY(MultiPolygon, 4326)
);

-- Admin Level 2: Districts
CREATE TABLE admin_districts (
    id SERIAL PRIMARY KEY,
    district_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    district_type VARCHAR(50) DEFAULT 'District',
    geom GEOMETRY(MultiPolygon, 4326)
);

-- Admin Level 3: Wards & Communes
CREATE TABLE admin_wards (
    id SERIAL PRIMARY KEY,
    ward_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    ward_type VARCHAR(50) DEFAULT 'Xã',
    province_id VARCHAR(50),
    province_name VARCHAR(255),
    population BIGINT DEFAULT 0,
    area_km2 NUMERIC(10, 2) DEFAULT 0,
    density NUMERIC(10, 2) DEFAULT 0,
    center_lon NUMERIC(9, 5),
    center_lat NUMERIC(9, 5),
    geom GEOMETRY(MultiPolygon, 4326)
);

-- Spatial and text search indexes
CREATE INDEX idx_admin_country_geom ON admin_country USING GIST(geom);
CREATE INDEX idx_admin_provinces_geom ON admin_provinces USING GIST(geom);
CREATE INDEX idx_admin_districts_geom ON admin_districts USING GIST(geom);
CREATE INDEX idx_admin_wards_geom ON admin_wards USING GIST(geom);

CREATE INDEX idx_admin_provinces_code ON admin_provinces(province_code);
CREATE INDEX idx_admin_districts_name ON admin_districts(name);
CREATE INDEX idx_admin_wards_name ON admin_wards(name);
CREATE INDEX idx_admin_wards_prov ON admin_wards(province_id);

CREATE INDEX idx_trgm_province_name ON province_demographics USING GIN(province_name gin_trgm_ops);
CREATE INDEX idx_trgm_district_name ON admin_districts USING GIN(name gin_trgm_ops);
CREATE INDEX idx_trgm_ward_name ON admin_wards USING GIN(name gin_trgm_ops);

-- Market Intelligence View for Martin Tile Server & APIs
CREATE OR REPLACE VIEW v_provinces_market AS
SELECT 
    p.id,
    p.province_code,
    COALESCE(d.province_name, p.name) as name,
    p.name as ascii_name,
    p.note,
    COALESCE(d.region, 'Việt Nam') as region,
    COALESCE(d.population, 0) as population,
    COALESCE(d.area_km2, 0) as area_km2,
    COALESCE(d.population_density, 0) as population_density,
    COALESCE(d.urban_pct, 0) as urban_pct,
    COALESCE(d.median_age, 32.5) as median_age,
    COALESCE(d.household_count, 0) as household_count,
    COALESCE(e.gdp_billion_vnd, 0) as gdp_billion_vnd,
    COALESCE(e.per_capita_income_million_vnd, 0) as per_capita_income_million_vnd,
    COALESCE(e.retail_sales_billion_vnd, 0) as retail_sales_billion_vnd,
    COALESCE(e.ecommerce_index, 0) as ecommerce_index,
    COALESCE(e.internet_penetration_pct, 0) as internet_penetration_pct,
    COALESCE(e.smartphone_penetration_pct, 0) as smartphone_penetration_pct,
    ROUND(
        LEAST(100.0, GREATEST(10.0, (
            (COALESCE(d.population, 500000)::numeric / 10000000.0 * 25.0) +
            (COALESCE(e.per_capita_income_million_vnd, 3.5)::numeric / 8.5 * 25.0) +
            (COALESCE(e.ecommerce_index, 20.0)::numeric / 88.0 * 30.0) +
            (COALESCE(d.urban_pct, 20.0)::numeric / 100.0 * 20.0)
        )))::numeric, 1
    ) as market_score,
    p.geom
FROM admin_provinces p
LEFT JOIN province_demographics d ON p.province_code = d.province_code
LEFT JOIN province_economics e ON p.province_code = e.province_code;
