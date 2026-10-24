from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings. Override with env vars prefixed SORTIR_ (e.g. SORTIR_DATABASE_URL)."""

    model_config = SettingsConfigDict(env_prefix="SORTIR_", env_file=".env", extra="ignore")

    database_url: str = "postgresql://root@localhost:26257/defaultdb?sslmode=disable"
    pool_min_size: int = 2
    pool_max_size: int = 20
    # Only ingest events that start within this many days from now.
    ingest_window_days: int = 90
    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
