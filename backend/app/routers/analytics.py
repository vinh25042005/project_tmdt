from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/api/analytics", tags=["Market Analytics"])

@router.get("/summary")
def get_national_summary(
    region: str = Query(None, description="Filter summary by economic region"),
    db: Session = Depends(get_db)
):
    sql = """
        SELECT 
            COUNT(*) as total_provinces,
            SUM(population) as total_population,
            ROUND(AVG(population_density)::numeric, 1) as avg_density,
            ROUND(AVG(urban_pct)::numeric, 1) as avg_urbanization_pct,
            SUM(gdp_billion_vnd) as total_gdp_billion_vnd,
            ROUND(AVG(per_capita_income_million_vnd)::numeric, 2) as avg_income_million_vnd,
            SUM(retail_sales_billion_vnd) as total_retail_sales_billion_vnd,
            ROUND(AVG(ecommerce_index)::numeric, 1) as avg_ecommerce_index,
            ROUND(AVG(internet_penetration_pct)::numeric, 1) as avg_internet_penetration_pct,
            ROUND(AVG(smartphone_penetration_pct)::numeric, 1) as avg_smartphone_penetration_pct
        FROM v_provinces_market
        WHERE province_code IS NOT NULL AND province_code != ''
    """
    params = {}
    if region:
        sql += " AND region = :region"
        params["region"] = region
    summary = db.execute(text(sql), params).mappings().first()

    top_markets_sql = """
        SELECT province_code, name, region, population, gdp_billion_vnd, market_score
        FROM v_provinces_market
        WHERE province_code IS NOT NULL AND province_code != ''
    """
    if region:
        top_markets_sql += " AND region = :region"
    top_markets_sql += """
        ORDER BY market_score DESC
        LIMIT 5
    """
    top_markets = db.execute(text(top_markets_sql), params).mappings().all()

    return {
        "summary": dict(summary) if summary else {},
        "top_markets": [dict(t) for t in top_markets]
    }

@router.get("/ranking")
def get_ranking(
    metric: str = Query("market_score", description="Metric to rank: market_score, population, gdp_billion_vnd, per_capita_income_million_vnd, ecommerce_index, retail_sales_billion_vnd"),
    region: str = Query(None, description="Filter ranking by economic region"),
    top: int = Query(10, ge=3, le=63),
    order: str = Query("desc", description="desc or asc"),
    db: Session = Depends(get_db)
):
    valid_metrics = {
        "market_score": "market_score",
        "population": "population",
        "gdp_billion_vnd": "gdp_billion_vnd",
        "per_capita_income_million_vnd": "per_capita_income_million_vnd",
        "ecommerce_index": "ecommerce_index",
        "retail_sales_billion_vnd": "retail_sales_billion_vnd",
        "population_density": "population_density",
        "urban_pct": "urban_pct"
    }
    col = valid_metrics.get(metric, "market_score")
    order_dir = "ASC" if order.lower() == "asc" else "DESC"

    sql = f"""
        SELECT 
            ROW_NUMBER() OVER(ORDER BY {col} {order_dir}) as rank,
            province_code,
            name,
            region,
            population,
            gdp_billion_vnd,
            per_capita_income_million_vnd,
            retail_sales_billion_vnd,
            ecommerce_index,
            urban_pct,
            market_score
        FROM v_provinces_market
        WHERE province_code IS NOT NULL AND province_code != ''
    """
    params = {"top": top}
    if region:
        sql += " AND region = :region"
        params["region"] = region
    sql += f"""
        ORDER BY {col} {order_dir}
        LIMIT :top
    """
    rows = db.execute(text(sql), params).mappings().all()
    return [dict(r) for r in rows]

@router.get("/compare")
def compare_provinces(
    codes: str = Query(..., description="Comma-separated province codes or ascii names, e.g. 01,79,48"),
    db: Session = Depends(get_db)
):
    code_list = [c.strip() for c in codes.split(",") if c.strip()]
    if not code_list:
        return []

    sql = """
        SELECT 
            province_code,
            name,
            region,
            population,
            area_km2,
            population_density,
            urban_pct,
            gdp_billion_vnd,
            per_capita_income_million_vnd,
            retail_sales_billion_vnd,
            ecommerce_index,
            internet_penetration_pct,
            smartphone_penetration_pct,
            market_score
        FROM v_provinces_market
        WHERE province_code = ANY(:codes) OR ascii_name = ANY(:codes)
        ORDER BY market_score DESC
    """
    rows = db.execute(text(sql), {"codes": code_list}).mappings().all()
    return [dict(r) for r in rows]

@router.get("/distribution")
def get_distribution(
    by: str = Query("region", description="Group by region"),
    db: Session = Depends(get_db)
):
    sql = """
        SELECT 
            region,
            COUNT(*) as province_count,
            SUM(population) as total_population,
            SUM(gdp_billion_vnd) as total_gdp,
            SUM(retail_sales_billion_vnd) as total_retail,
            ROUND(AVG(market_score)::numeric, 1) as avg_market_score
        FROM v_provinces_market
        WHERE region IS NOT NULL
        GROUP BY region
        ORDER BY total_population DESC
    """
    rows = db.execute(text(sql)).mappings().all()
    return [dict(r) for r in rows]
