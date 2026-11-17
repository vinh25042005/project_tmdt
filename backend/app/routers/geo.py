from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/api", tags=["Geographical & Administrative"])

@router.get("/provinces")
def get_provinces(
    region: str = Query(None, description="Filter by region (e.g. Đông Nam Bộ)"),
    sort_by: str = Query("market_score", description="Sort field: market_score, population, gdp_billion_vnd, per_capita_income_million_vnd"),
    order: str = Query("desc", description="Sort order: asc or desc"),
    db: Session = Depends(get_db)
):
    valid_sorts = {
        "market_score": "market_score",
        "population": "population",
        "gdp_billion_vnd": "gdp_billion_vnd",
        "per_capita_income_million_vnd": "per_capita_income_million_vnd",
        "ecommerce_index": "ecommerce_index",
        "population_density": "population_density",
        "name": "name"
    }
    sort_col = valid_sorts.get(sort_by, "market_score")
    order_dir = "ASC" if order.lower() == "asc" else "DESC"

    query = """
        SELECT 
            id, province_code, name, ascii_name, note, region,
            population, area_km2, population_density, urban_pct,
            gdp_billion_vnd, per_capita_income_million_vnd, retail_sales_billion_vnd,
            ecommerce_index, internet_penetration_pct, smartphone_penetration_pct,
            market_score,
            ST_AsGeoJSON(ST_Centroid(geom)) as centroid,
            ST_AsGeoJSON(ST_Envelope(geom)) as bbox
        FROM v_provinces_market
        WHERE 1=1
    """
    params = {}
    if region:
        query += " AND region = :region"
        params["region"] = region

    query += f" ORDER BY {sort_col} {order_dir}"

    rows = db.execute(text(query), params).mappings().all()
    results = []
    for r in rows:
        results.append(dict(r))
    return results

@router.get("/provinces/{code}")
def get_province_detail(code: str, db: Session = Depends(get_db)):
    query = """
        SELECT 
            id, province_code, name, ascii_name, note, region,
            population, area_km2, population_density, urban_pct,
            gdp_billion_vnd, per_capita_income_million_vnd, retail_sales_billion_vnd,
            ecommerce_index, internet_penetration_pct, smartphone_penetration_pct,
            market_score,
            ST_AsGeoJSON(ST_Centroid(geom)) as centroid
        FROM v_provinces_market
        WHERE province_code = :code OR ascii_name = :code
        LIMIT 1
    """
    row = db.execute(text(query), {"code": code}).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Province not found")

    result = dict(row)

    # Fetch wards for this province
    wards_query = """
        SELECT ward_id, name, ward_type, population, area_km2, density, center_lon, center_lat
        FROM admin_wards
        WHERE province_id = :code OR province_name ILIKE :name
        ORDER BY population DESC
    """
    wards = db.execute(text(wards_query), {
        "code": result.get("province_code", ""),
        "name": f"%{result.get('name', '')}%"
    }).mappings().all()

    result["wards"] = [dict(w) for w in wards]
    return result

@router.get("/provinces/{code}/wards")
def get_province_wards(code: str, db: Session = Depends(get_db)):
    query = """
        SELECT ward_id, name, ward_type, province_id, province_name,
               population, area_km2, density, center_lon, center_lat
        FROM admin_wards
        WHERE province_id = :code
        ORDER BY population DESC
    """
    rows = db.execute(text(query), {"code": code}).mappings().all()
    return [dict(r) for r in rows]

@router.get("/districts")
def get_districts(
    limit: int = Query(50, ge=1, le=750),
    q: str = Query(None),
    db: Session = Depends(get_db)
):
    query = "SELECT id, district_id, name, district_type FROM admin_districts WHERE 1=1"
    params = {}
    if q:
        query += " AND name ILIKE :q"
        params["q"] = f"%{q}%"
    query += " ORDER BY name ASC LIMIT :limit"
    params["limit"] = limit

    rows = db.execute(text(query), params).mappings().all()
    return [dict(r) for r in rows]

@router.get("/regions")
def get_regions(db: Session = Depends(get_db)):
    query = """
        SELECT 
            region,
            COUNT(*) as province_count,
            SUM(population) as total_population,
            ROUND(AVG(population_density)::numeric, 1) as avg_density,
            SUM(gdp_billion_vnd) as total_gdp_billion_vnd,
            ROUND(AVG(per_capita_income_million_vnd)::numeric, 2) as avg_income_million_vnd,
            ROUND(AVG(ecommerce_index)::numeric, 1) as avg_ecommerce_index,
            ROUND(AVG(market_score)::numeric, 1) as avg_market_score
        FROM v_provinces_market
        WHERE region IS NOT NULL
        GROUP BY region
        ORDER BY total_population DESC
    """
    rows = db.execute(text(query)).mappings().all()
    return [dict(r) for r in rows]

@router.get("/geojson/provinces")
def get_provinces_geojson(db: Session = Depends(get_db)):
    sql = """
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(json_agg(
                json_build_object(
                    'type', 'Feature',
                    'geometry', ST_AsGeoJSON(geom)::json,
                    'properties', json_build_object(
                        'id', id,
                        'province_code', province_code,
                        'name', name,
                        'ascii_name', ascii_name,
                        'region', region,
                        'population', population,
                        'area_km2', area_km2,
                        'population_density', population_density,
                        'urban_pct', urban_pct,
                        'gdp_billion_vnd', gdp_billion_vnd,
                        'per_capita_income_million_vnd', per_capita_income_million_vnd,
                        'retail_sales_billion_vnd', retail_sales_billion_vnd,
                        'ecommerce_index', ecommerce_index,
                        'internet_penetration_pct', internet_penetration_pct,
                        'smartphone_penetration_pct', smartphone_penetration_pct,
                        'market_score', market_score
                    )
                )
            ), '[]'::json)
        )::text
        FROM v_provinces_market;
    """
    geojson_str = db.execute(text(sql)).scalar()
    return Response(content=geojson_str or '{"type":"FeatureCollection","features":[]}', media_type="application/json")

@router.get("/geojson/districts")
def get_districts_geojson(
    province_id: str = Query(None),
    limit: int = Query(750),
    db: Session = Depends(get_db)
):
    sql = """
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(json_agg(
                json_build_object(
                    'type', 'Feature',
                    'geometry', ST_AsGeoJSON(geom)::json,
                    'properties', json_build_object(
                        'id', id,
                        'district_id', district_id,
                        'name', name,
                        'district_type', district_type
                    )
                )
            ), '[]'::json)
        )::text
        FROM (SELECT * FROM admin_districts LIMIT :limit) d;
    """
    geojson_str = db.execute(text(sql), {"limit": limit}).scalar()
    return Response(content=geojson_str or '{"type":"FeatureCollection","features":[]}', media_type="application/json")

@router.get("/geojson/wards")
def get_wards_geojson(
    province_id: str = Query(None),
    limit: int = Query(1000),
    db: Session = Depends(get_db)
):
    sql = """
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(json_agg(
                json_build_object(
                    'type', 'Feature',
                    'geometry', ST_AsGeoJSON(geom)::json,
                    'properties', json_build_object(
                        'id', id,
                        'ward_id', ward_id,
                        'name', name,
                        'ward_type', ward_type,
                        'province_id', province_id,
                        'province_name', province_name,
                        'population', population,
                        'area_km2', area_km2,
                        'density', density
                    )
                )
            ), '[]'::json)
        )::text
        FROM (
            SELECT * FROM admin_wards 
            WHERE (:prov_id IS NULL OR province_id = :prov_id)
            LIMIT :limit
        ) w;
    """
    geojson_str = db.execute(text(sql), {"prov_id": province_id, "limit": limit}).scalar()
    return Response(content=geojson_str or '{"type":"FeatureCollection","features":[]}', media_type="application/json")

