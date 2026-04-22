from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Case description text")


class EntitiesResponse(BaseModel):
    persons: list[str]
    locations: list[str]
    weapons: list[str]


class AnalyzeResponse(BaseModel):
    embedding: list[float]
    entities: EntitiesResponse


class SimilarRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Query text")
    stored_embeddings: list[list[float]] = Field(
        default_factory=list,
        description="List of stored case embeddings",
    )


class SimilarMatch(BaseModel):
    index: int
    similarity: float


class SimilarResponse(BaseModel):
    matches: list[SimilarMatch]
