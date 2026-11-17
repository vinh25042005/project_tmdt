import json
import csv
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
INIT_DIR = os.path.join(BASE_DIR, 'init')

os.makedirs(INIT_DIR, exist_ok=True)

schema_sql = """-- Extensions
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
"""

with open(os.path.join(INIT_DIR, '01-schema.sql'), 'w', encoding='utf-8') as f:
    f.write(schema_sql)

print("Generated 01-schema.sql")

def escape_sql(val):
    if val is None:
        return 'NULL'
    s = str(val).replace("'", "''")
    return f"'{s}'"

seed_sql_path = os.path.join(INIT_DIR, '02-seed-data.sql')

with open(seed_sql_path, 'w', encoding='utf-8') as out:
    out.write("-- Seed Demographics\n")
    demo_map = {}
    with open(os.path.join(DATA_DIR, 'provinces_demographics.csv'), encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            demo_map[r['ascii_name']] = r
            out.write(f"INSERT INTO province_demographics (province_code, province_name, ascii_name, region, population, area_km2, population_density, urban_pct, median_age, household_count) VALUES ("
                      f"{escape_sql(r['province_code'])}, {escape_sql(r['province_name'])}, {escape_sql(r['ascii_name'])}, {escape_sql(r['region'])}, "
                      f"{r['population']}, {r['area_km2']}, {r['population_density']}, {r['urban_pct']}, {r['median_age']}, {r['household_count']});\n")
    
    out.write("\n-- Seed Economics\n")
    with open(os.path.join(DATA_DIR, 'provinces_economics.csv'), encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            out.write(f"INSERT INTO province_economics (province_code, province_name, ascii_name, gdp_billion_vnd, per_capita_income_million_vnd, retail_sales_billion_vnd, ecommerce_index, internet_penetration_pct, smartphone_penetration_pct) VALUES ("
                      f"{escape_sql(r['province_code'])}, {escape_sql(r['province_name'])}, {escape_sql(r['ascii_name'])}, "
                      f"{r['gdp_billion_vnd']}, {r['per_capita_income_million_vnd']}, {r['retail_sales_billion_vnd']}, {r['ecommerce_index']}, {r['internet_penetration_pct']}, {r['smartphone_penetration_pct']});\n")

    out.write("\n-- Seed Country\n")
    with open(os.path.join(DATA_DIR, 'vietnam_country.geojson'), encoding='utf-8') as f:
        country_geo = json.load(f)
        for feat in country_geo['features']:
            geom_str = json.dumps(feat['geometry'])
            out.write(f"INSERT INTO admin_country (name, geom) VALUES ('Việt Nam', ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON({escape_sql(geom_str)}), 4326)));\n")

    out.write("\n-- Seed Provinces\n")
    with open(os.path.join(DATA_DIR, 'vietnam_provinces.geojson'), encoding='utf-8') as f:
        prov_geo = json.load(f)
        for feat in prov_geo['features']:
            name = feat['properties']['Name']
            note = feat['properties'].get('Note')
            demo = demo_map.get(name)
            p_code = demo['province_code'] if demo else ''
            p_vi = demo['province_name'] if demo else name
            geom_str = json.dumps(feat['geometry'])
            out.write(f"INSERT INTO admin_provinces (province_code, name, name_vi, note, geom) VALUES ("
                      f"{escape_sql(p_code)}, {escape_sql(name)}, {escape_sql(p_vi)}, {escape_sql(note)}, "
                      f"ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON({escape_sql(geom_str)}), 4326)));\n")

    out.write("\n-- Seed Districts\n")
    with open(os.path.join(DATA_DIR, 'vietnam_districts.geojson'), encoding='utf-8') as f:
        dist_geo = json.load(f)
        for feat in dist_geo['features']:
            props = feat['properties']
            d_id = props.get('shapeID', '')
            d_name = props.get('shapeName', '')
            d_type = props.get('shapeType', 'ADM2')
            geom_str = json.dumps(feat['geometry'])
            out.write(f"INSERT INTO admin_districts (district_id, name, district_type, geom) VALUES ("
                      f"{escape_sql(d_id)}, {escape_sql(d_name)}, {escape_sql(d_type)}, "
                      f"ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON({escape_sql(geom_str)}), 4326)));\n")

    out.write("\n-- Seed Wards\n")
    with open(os.path.join(DATA_DIR, 'vietnam_wards.geojson'), encoding='utf-8') as f:
        ward_geo = json.load(f)
        for feat in ward_geo['features']:
            props = feat['properties']
            w_id = props.get('ward_id', '')
            w_name = props.get('name', '')
            w_type = props.get('type', 'Xã')
            p_id = props.get('province_id', '')
            p_name = props.get('province_name', '')
            pop = props.get('population', 0)
            area = props.get('area_km2', 0)
            density = props.get('density', 0)
            c_lon = props.get('center_lon', 0)
            c_lat = props.get('center_lat', 0)
            geom_str = json.dumps(feat['geometry'])
            out.write(f"INSERT INTO admin_wards (ward_id, name, ward_type, province_id, province_name, population, area_km2, density, center_lon, center_lat, geom) VALUES ("
                      f"{escape_sql(w_id)}, {escape_sql(w_name)}, {escape_sql(w_type)}, {escape_sql(p_id)}, {escape_sql(p_name)}, "
                      f"{pop}, {area}, {density}, {c_lon}, {c_lat}, "
                      f"ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON({escape_sql(geom_str)}), 4326)));\n")

print(f"Generated {seed_sql_path}")
