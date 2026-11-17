from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/api/decision", tags=["Decision Support & Recommendations"])

@router.get("/recommendations")
def get_recommendations(
    w_pop: float = Query(0.25, ge=0.0, le=1.0, description="Weight for population size"),
    w_income: float = Query(0.25, ge=0.0, le=1.0, description="Weight for income/purchasing power"),
    w_ecom: float = Query(0.30, ge=0.0, le=1.0, description="Weight for e-commerce readiness"),
    w_urban: float = Query(0.20, ge=0.0, le=1.0, description="Weight for urbanization/logistics"),
    region: str = Query(None, description="Filter to specific region"),
    top: int = Query(10, ge=3, le=63),
    db: Session = Depends(get_db)
):
    """
    Decision Support Engine: Recommends target provinces based on multi-criteria decision analysis (MCDA).
    Computes normalized scores (0-100) dynamically using customizable business weights.
    """
    # Normalize weights so sum = 1.0
    total_w = w_pop + w_income + w_ecom + w_urban
    if total_w == 0:
        w_pop, w_income, w_ecom, w_urban = 0.25, 0.25, 0.30, 0.20
        total_w = 1.0
    nw_pop = w_pop / total_w
    nw_income = w_income / total_w
    nw_ecom = w_ecom / total_w
    nw_urban = w_urban / total_w

    sql = """
        SELECT 
            province_code,
            name,
            region,
            population,
            urban_pct,
            gdp_billion_vnd,
            per_capita_income_million_vnd,
            retail_sales_billion_vnd,
            ecommerce_index,
            internet_penetration_pct,
            smartphone_penetration_pct,
            -- Normalized indicators (0-100)
            ROUND((population::numeric / 9500000.0 * 100.0)::numeric, 1) as score_population,
            ROUND((per_capita_income_million_vnd::numeric / 8.5 * 100.0)::numeric, 1) as score_income,
            ROUND((ecommerce_index::numeric / 88.0 * 100.0)::numeric, 1) as score_ecommerce,
            ROUND((urban_pct::numeric)::numeric, 1) as score_urban
        FROM v_provinces_market
        WHERE province_code IS NOT NULL AND province_code != ''
    """
    params = {}
    if region:
        sql += " AND region = :region"
        params["region"] = region

    rows = db.execute(text(sql), params).mappings().all()

    evaluated = []
    for r in rows:
        d = dict(r)
        # Calculate dynamic composite score
        pop_s = min(100.0, float(d["score_population"] or 0))
        inc_s = min(100.0, float(d["score_income"] or 0))
        eco_s = min(100.0, float(d["score_ecommerce"] or 0))
        urb_s = min(100.0, float(d["score_urban"] or 0))

        custom_score = round(
            (pop_s * nw_pop) + 
            (inc_s * nw_income) + 
            (eco_s * nw_ecom) + 
            (urb_s * nw_urban), 
            1
        )
        d["custom_score"] = custom_score

        # Tier classification
        if custom_score >= 65:
            d["market_tier"] = "Tier 1: Trọng điểm Quốc gia"
            d["tier_color"] = "#ef4444"
            d["strategy"] = "Đầu tư mạnh mẽ vào Omnichannel, kho vận tức thời, marketing định vị cao cấp."
        elif custom_score >= 40:
            d["market_tier"] = "Tier 2: Thị trường Đang phát triển"
            d["tier_color"] = "#f59e0b"
            d["strategy"] = "Mở rộng hệ thống phân phối, tập trung phân khúc phổ thông & digital marketing."
        else:
            d["market_tier"] = "Tier 3: Thị trường Tiềm năng dài hạn"
            d["tier_color"] = "#3b82f6"
            d["strategy"] = "Phát triển qua đại lý địa phương, chú trọng sản phẩm thiết yếu và giá cả cạnh tranh."

        evaluated.append(d)

    # Sort by custom score descending
    evaluated.sort(key=lambda x: x["custom_score"], reverse=True)

    return {
        "weights_used": {
            "population": round(nw_pop, 2),
            "income": round(nw_income, 2),
            "ecommerce": round(nw_ecom, 2),
            "urbanization": round(nw_urban, 2)
        },
        "count": len(evaluated[:top]),
        "recommendations": evaluated[:top]
    }

@router.get("/market-profile/{code}")
def get_market_profile(code: str, db: Session = Depends(get_db)):
    """
    Provides a comprehensive decision dossier for a specific province:
    - Customer demographic profile
    - Purchasing capacity
    - Digital readiness
    - Recommended product categories
    """
    sql = """
        SELECT 
            province_code, name, region, population, area_km2, population_density,
            urban_pct, median_age, household_count,
            gdp_billion_vnd, per_capita_income_million_vnd, retail_sales_billion_vnd,
            ecommerce_index, internet_penetration_pct, smartphone_penetration_pct,
            market_score
        FROM v_provinces_market
        WHERE province_code = :code OR ascii_name = :code
        LIMIT 1
    """
    row = db.execute(text(sql), {"code": code}).mappings().first()
    if not row:
        return {"error": "Province not found"}

    data = dict(row)
    income = float(data.get("per_capita_income_million_vnd") or 4.0)
    urban = float(data.get("urban_pct") or 20.0)
    ecom = float(data.get("ecommerce_index") or 30.0)

    # Product category recommendations based on demographic indicators
    suitable_categories = []
    if income >= 6.0:
        suitable_categories.append({"category": "Thiết bị Công nghệ & Điện tử cao cấp", "potential": "Rất cao", "fit_reason": "Thu nhập bình quân cao, tỷ lệ smartphone >90%"})
        suitable_categories.append({"category": "Mỹ phẩm & Chăm sóc cá nhân thương hiệu", "potential": "Rất cao", "fit_reason": "Tầng lớp trung lưu đông, nhu cầu phong cách sống cao"})
    else:
        suitable_categories.append({"category": "Hàng tiêu dùng nhanh (FMCG) phổ thông", "potential": "Cao", "fit_reason": "Quy mô hộ gia đình ổn định, ưu tiên sản phẩm thiết yếu"})

    if urban >= 50.0:
        suitable_categories.append({"category": "Giao đồ ăn & Dịch vụ tức thì (Instant Delivery)", "potential": "Rất cao", "fit_reason": "Đô thị hóa cao, hạ tầng logistics thuận lợi"})
        suitable_categories.append({"category": "Nội thất & Gia dụng hiện đại", "potential": "Cao", "fit_reason": "Tỷ lệ căn hộ và nhà ở đô thị cao"})
    else:
        suitable_categories.append({"category": "Vật tư gia dụng & Phương tiện di chuyển bền bỉ", "potential": "Cao", "fit_reason": "Khu vực nông thôn và bán đô thị"})

    if ecom >= 40.0:
        suitable_categories.append({"category": "Thương mại điện tử & Livestream Shopping", "potential": "Tối ưu", "fit_reason": "Chỉ số EBI cao, thói quen mua sắm trực tuyến thành thạo"})
    else:
        suitable_categories.append({"category": "Mô hình O2O (Online to Offline)", "potential": "Tiềm năng", "fit_reason": "Người mua thích kiểm tra sản phẩm tại cửa hàng"})

    return {
        "province": data,
        "customer_segments": [
            {"segment": "Giới trẻ Đô thị (Gen Z & Millennial)", "estimated_share": f"{round(min(55, urban * 0.6))}%", "channel_preference": "TikTok Shop, Shopee, Instagram"},
            {"segment": "Gia đình Trẻ (28 - 45 tuổi)", "estimated_share": "35%", "channel_preference": "Siêu thị, Thương mại điện tử, Facebook Groups"},
            {"segment": "Trung niên & Truyền thống", "estimated_share": f"{round(max(15, 100 - urban * 0.6 - 35))}%", "channel_preference": "Chợ truyền thống, Cửa hàng tạp hóa"}
        ],
        "suitable_categories": suitable_categories
    }
