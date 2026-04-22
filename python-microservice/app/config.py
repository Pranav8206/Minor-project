import os


class Settings:
    service_name: str = os.getenv("SERVICE_NAME", "case-intelligence-service")
    sentence_model_name: str = os.getenv(
        "SENTENCE_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"
    )
    spacy_model_name: str = os.getenv("SPACY_MODEL_NAME", "en_core_web_sm")


settings = Settings()
