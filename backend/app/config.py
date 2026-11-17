import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    raw_db_url: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+psycopg2://docker:docker@db:5432/gis"
    )
    MARTIN_URL: str = os.getenv("MARTIN_URL", "http://localhost:3000")
    CORS_ORIGINS: list[str] = ["*"]

    @property
    def DATABASE_URL(self) -> str:
        url = self.raw_db_url
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    class Config:
        env_file = ".env"

settings = Settings()
