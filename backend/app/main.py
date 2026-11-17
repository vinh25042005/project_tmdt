from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import geo, search, analytics, decision

app = FastAPI(
    title="Vietnam Market Intelligence API",
    description="Hệ thống phân tích bản đồ số & nhu cầu thị trường khách hàng Việt Nam",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(geo.router)
app.include_router(search.router)
app.include_router(analytics.router)
app.include_router(decision.router)

@app.get("/")
def root():
    return {
        "system": "Vietnam Market Intelligence Platform (VN-MarketMap)",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "modules": [
            "Geographical & Administrative Boundaries (Country, Provinces, Districts, Wards)",
            "Demographics & Population Density",
            "Economics & E-commerce Index",
            "Full-text & Spatial Search",
            "Market Analytics & Rankings",
            "Decision Support & Expansion Recommendations"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
