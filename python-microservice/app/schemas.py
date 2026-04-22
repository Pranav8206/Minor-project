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
