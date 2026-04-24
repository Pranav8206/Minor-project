import os


class Settings:
    service_name: str = os.getenv("SERVICE_NAME", "case-intelligence-service")
    embedding_dimensions: int = int(os.getenv("EMBEDDING_DIMENSIONS", "128"))


settings = Settings()
