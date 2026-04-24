from functools import lru_cache
import hashlib
from math import sqrt
import re

from .config import settings


class NLPService:
    def __init__(self) -> None:
        self._weapon_terms = [
            "gun",
            "pistol",
            "rifle",
            "shotgun",
            "knife",
            "machete",
            "sword",
            "grenade",
            "explosive",
            "bomb",
            "bat",
            "crowbar",
        ]
        self._weapon_term_set = set(self._weapon_terms)
        self._embedding_dimensions = max(int(getattr(settings, "embedding_dimensions", 128)), 16)
        self._word_pattern = re.compile(r"[A-Za-z][A-Za-z'-]{1,}")
        self._person_pattern = re.compile(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b")
        self._location_context_pattern = re.compile(
            r"\b(?:in|at|near|around|from)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\b"
        )

    def analyze(self, text: str) -> dict:
        embedding = self._embed_text(text)
        locations = self._extract_locations(text)
        location_set = {location.lower() for location in locations}
        persons = [person for person in self._extract_persons(text) if person.lower() not in location_set]
        weapons = self._extract_weapons(text)

        return {
            "embedding": embedding,
            "entities": {
                "persons": persons,
                "locations": locations,
                "weapons": weapons,
            },
        }

    def find_similar_cases(
        self,
        query: str,
        stored_embeddings: list[list[float]],
        top_k: int = 5,
    ) -> list[dict]:
        query_embedding = self._embed_text(query)

        scored_matches = []

        for index, candidate in enumerate(stored_embeddings):
            similarity = self._cosine_similarity(query_embedding, candidate)
            if similarity is None:
                continue

            scored_matches.append({
                "index": index,
                "similarity": similarity,
            })

        scored_matches.sort(key=lambda item: item["similarity"], reverse=True)
        return scored_matches[:top_k]

    def _embed_text(self, text: str) -> list[float]:
        tokens = [token.lower() for token in self._word_pattern.findall(text)]
        if not tokens:
            return [0.0] * self._embedding_dimensions

        vector = [0.0] * self._embedding_dimensions

        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % self._embedding_dimensions
            sign = -1.0 if digest[4] % 2 else 1.0
            vector[index] += sign

        norm = sqrt(sum(value * value for value in vector))
        if norm == 0.0:
            return vector

        return [value / norm for value in vector]

    def _extract_persons(self, text: str) -> list[str]:
        return self._unique_preserve_order(
            match.group(1).strip()
            for match in self._person_pattern.finditer(text)
        )

    def _extract_locations(self, text: str) -> list[str]:
        return self._unique_preserve_order(
            match.group(1).strip()
            for match in self._location_context_pattern.finditer(text)
        )

    def _extract_weapons(self, text: str) -> list[str]:
        tokens = [token.lower() for token in self._word_pattern.findall(text)]
        return self._unique_preserve_order(token for token in tokens if token in self._weapon_term_set)

    @staticmethod
    def _cosine_similarity(a: list[float], b: list[float]) -> float | None:
        if not isinstance(a, list) or not isinstance(b, list):
            return None

        if len(a) == 0 or len(a) != len(b):
            return None

        if not all(isinstance(value, (int, float)) for value in a):
            return None

        if not all(isinstance(value, (int, float)) for value in b):
            return None

        dot_product = sum(float(x) * float(y) for x, y in zip(a, b, strict=False))
        norm_a = sqrt(sum(float(x) * float(x) for x in a))
        norm_b = sqrt(sum(float(y) * float(y) for y in b))

        if norm_a == 0.0 or norm_b == 0.0:
            return None

        return dot_product / (norm_a * norm_b)

    @staticmethod
    def _unique_preserve_order(values):
        seen = set()
        ordered = []

        for value in values:
            if not value:
                continue
            normalized = value.lower()
            if normalized in seen:
                continue
            seen.add(normalized)
            ordered.append(value)

        return ordered


@lru_cache(maxsize=1)
def get_nlp_service() -> NLPService:
    return NLPService()
