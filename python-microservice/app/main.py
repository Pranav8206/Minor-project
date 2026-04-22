from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from .config import settings
from .nlp_service import get_nlp_service
from .schemas import AnalyzeRequest, AnalyzeResponse, SimilarRequest, SimilarResponse


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


@app.post("/similar", response_model=SimilarResponse)
def find_similar_cases(payload: SimilarRequest) -> SimilarResponse:
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="query cannot be empty")

    matches = get_nlp_service().find_similar_cases(
        query=query,
        stored_embeddings=payload.stored_embeddings,
        top_k=5,
    )

    return SimilarResponse(matches=matches)
