from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from .config import settings
from .nlp_service import get_nlp_service
from .schemas import AnalyzeRequest, AnalyzeResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload models at startup so runtime requests stay low-latency.
    get_nlp_service()
    yield


app = FastAPI(title=settings.service_name, version="1.0.0", lifespan=lifespan)


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_case(payload: AnalyzeRequest) -> AnalyzeResponse:
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text cannot be empty")

    result = get_nlp_service().analyze(text)
    return AnalyzeResponse(**result)
