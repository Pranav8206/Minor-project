# Case Intelligence FastAPI Service

A production-oriented FastAPI microservice for case text analysis.

## Features

- `POST /analyze`
- Embeddings with `sentence-transformers/all-MiniLM-L6-v2`
- Entity extraction with spaCy (`persons`, `locations`)
- Weapon keyword extraction via spaCy PhraseMatcher
- Startup model preloading for low-latency inference

## Request

```json
{
  "text": "case description"
}
```

## Response

```json
{
  "embedding": [0.123, 0.456],
  "entities": {
    "persons": ["John Doe"],
    "locations": ["Downtown"],
    "weapons": ["knife"]
  }
}
```

## Setup

1. Create and activate a Python virtual environment.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Download spaCy model:
   - `python -m spacy download en_core_web_sm`
4. Run service:
   - `uvicorn app.main:app --host 0.0.0.0 --port 8000`

## Health Check

- `GET /health`
