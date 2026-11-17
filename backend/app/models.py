from sqlalchemy import Column, Integer, String, BigInteger, Numeric, text
from app.database import Base

class ProvinceDemographics(Base):
    __tablename__ = "province_demographics"

    province_code = Column(String(20), primary_key=True)
    province_name = Column(String(255), nullable=False)
    ascii_name = Column(String(255), nullable=False)
    region = Column(String(100), nullable=False)
    population = Column(BigInteger, nullable=False)
    area_km2 = Column(Numeric(12, 2), nullable=False)
    population_density = Column(Numeric(12, 2), nullable=False)
    urban_pct = Column(Numeric(5, 2), nullable=False)
    median_age = Column(Numeric(4, 1), default=32.5)
    household_count = Column(BigInteger, nullable=False)


class ProvinceEconomics(Base):
    __tablename__ = "province_economics"

    province_code = Column(String(20), primary_key=True)
    province_name = Column(String(255), nullable=False)
    ascii_name = Column(String(255), nullable=False)
    gdp_billion_vnd = Column(Numeric(14, 2), nullable=False)
    per_capita_income_million_vnd = Column(Numeric(6, 2), nullable=False)
    retail_sales_billion_vnd = Column(Numeric(14, 2), nullable=False)
    ecommerce_index = Column(Numeric(5, 2), nullable=False)
    internet_penetration_pct = Column(Numeric(5, 2), nullable=False)
    smartphone_penetration_pct = Column(Numeric(5, 2), nullable=False)


class AdminProvince(Base):
    __tablename__ = "admin_provinces"

    id = Column(Integer, primary_key=True, index=True)
    province_code = Column(String(20), index=True)
    name = Column(String(255), nullable=False)
    name_vi = Column(String(255))
    note = Column(String(255))


class AdminDistrict(Base):
    __tablename__ = "admin_districts"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(String(50))
    name = Column(String(255), nullable=False, index=True)
    district_type = Column(String(50))


class AdminWard(Base):
    __tablename__ = "admin_wards"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(String(50))
    name = Column(String(255), nullable=False, index=True)
    ward_type = Column(String(50))
    province_id = Column(String(50), index=True)
    province_name = Column(String(255))
    population = Column(BigInteger, default=0)
    area_km2 = Column(Numeric(10, 2), default=0)
    density = Column(Numeric(10, 2), default=0)
    center_lon = Column(Numeric(9, 5))
    center_lat = Column(Numeric(9, 5))
