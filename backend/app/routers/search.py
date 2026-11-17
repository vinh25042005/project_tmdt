from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/api/search", tags=["Search & Geolocation"])

@router.get("")
def search_locations(
    q: str = Query(..., min_length=1, description="Search term in Vietnamese or ASCII"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Search provinces, districts, and wards using trigram fuzzy matching & unaccent.
    """
    search_term = q.strip()
    param = f"%{search_term}%"

    # 1. Search Provinces
    p_sql = """
        SELECT 
            'province' as type,
            province_code as code,
            name,
            region,
            population,
            gdp_billion_vnd,
            market_score,
            ST_X(ST_Centroid(geom)) as lon,
            ST_Y(ST_Centroid(geom)) as lat
        FROM v_provinces_market
        WHERE name ILIKE :param 
           OR ascii_name ILIKE :param
           OR unaccent(name) ILIKE unaccent(:param)
        LIMIT :limit
    """
    provinces = db.execute(text(p_sql), {"param": param, "limit": limit}).mappings().all()

    # 2. Search Districts
    d_sql = """
        SELECT 
            'district' as type,
            district_id as code,
            name,
            district_type as region,
            0 as population,
            0 as gdp_billion_vnd,
            0 as market_score,
            ST_X(ST_Centroid(geom)) as lon,
            ST_Y(ST_Centroid(geom)) as lat
        FROM admin_districts
        WHERE name ILIKE :param 
           OR unaccent(name) ILIKE unaccent(:param)
        LIMIT :limit
    """
    districts = db.execute(text(d_sql), {"param": param, "limit": limit}).mappings().all()

    # 3. Search Wards
    w_sql = """
        SELECT 
            'ward' as type,
            ward_id as code,
            CONCAT(name, ' (', province_name, ')') as name,
            province_name as region,
            population,
            0 as gdp_billion_vnd,
            0 as market_score,
            center_lon as lon,
            center_lat as lat
        FROM admin_wards
        WHERE name ILIKE :param 
           OR unaccent(name) ILIKE unaccent(:param)
        LIMIT :limit
    """
    wards = db.execute(text(w_sql), {"param": param, "limit": limit}).mappings().all()

    combined = [dict(p) for p in provinces] + [dict(d) for d in districts] + [dict(w) for w in wards]
    return combined[:limit]

@router.get("/nearby")
def search_nearby(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius_km: float = Query(50.0, ge=1.0, le=500.0, description="Radius in kilometers"),
    db: Session = Depends(get_db)
):
    """
    Find provinces and wards within a given radius using ST_DWithin and ST_DistanceSphere.
    """
    sql = """
        SELECT 
            p.province_code,
            p.name,
            p.region,
            p.population,
            p.gdp_billion_vnd,
            p.market_score,
            ROUND((ST_DistanceSphere(ST_Centroid(p.geom), ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) / 1000.0)::numeric, 1) as distance_km,
            ST_X(ST_Centroid(p.geom)) as lon,
            ST_Y(ST_Centroid(p.geom)) as lat
        FROM v_provinces_market p
        WHERE ST_DWithin(
            p.geom::geography,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radius_meters
        )
        ORDER BY distance_km ASC
        LIMIT 10
    """
    rows = db.execute(text(sql), {
        "lat": lat,
        "lng": lng,
        "radius_meters": radius_km * 1000.0
    }).mappings().all()

    return [dict(r) for r in rows]
