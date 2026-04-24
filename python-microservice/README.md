# Case Intelligence FastAPI Service

A production-oriented FastAPI microservice for case text analysis.

## Features

- `POST /analyze`
- `POST /similar` (cosine similarity, top 5)
- Deterministic lightweight embeddings (hash-based, normalized)
- Rule-based entity extraction (`persons`, `locations`, `weapons`)
- Zero model downloads required

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

## Similarity Endpoint

Request:

```json
{
  "query": "masked robbery near station",
  "stored_embeddings": [[0.1, 0.2], [0.3, 0.4], [0.9, 0.1]]
}
```

Response:

```json
{
  "matches": [
    { "index": 2, "similarity": 0.9812 },
    { "index": 1, "similarity": 0.7033 }
  ]
}
```

The service returns up to 5 matches sorted by highest cosine similarity.

## Setup

1. Create and activate a Python virtual environment.
2. Install dependencies:
  - `pip install -r requirements.txt`
3. Run service:
  - `uvicorn app.main:app --host 0.0.0.0 --port 8000`

## Health Check

- `GET /health`

