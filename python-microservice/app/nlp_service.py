from functools import lru_cache
from math import sqrt

import spacy
from sentence_transformers import SentenceTransformer
from spacy.matcher import PhraseMatcher

from .config import settings


class NLPService:
    def __init__(self) -> None:
        self._embedding_model = SentenceTransformer(settings.sentence_model_name)
        try:
            self._nlp = spacy.load(settings.spacy_model_name)
        except OSError as exc:
            message = (
                f"spaCy model '{settings.spacy_model_name}' is not installed. "
                "Install it with: python -m spacy download en_core_web_sm"
            )
            raise RuntimeError(message) from exc

        self._weapon_matcher = PhraseMatcher(self._nlp.vocab, attr="LOWER")
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
        self._weapon_matcher.add("WEAPON", [self._nlp.make_doc(term) for term in self._weapon_terms])

    def analyze(self, text: str) -> dict:
        embedding = self._embedding_model.encode(text, normalize_embeddings=True).tolist()
        doc = self._nlp(text)

        persons = self._unique_preserve_order(
            ent.text.strip() for ent in doc.ents if ent.label_ == "PERSON"
        )

        locations = self._unique_preserve_order(
            ent.text.strip()
            for ent in doc.ents
            if ent.label_ in {"GPE", "LOC", "FAC"}
        )

        matched_weapons = []
        for _, start, end in self._weapon_matcher(doc):
            matched_weapons.append(doc[start:end].text.strip())

        weapons = self._unique_preserve_order(matched_weapons)

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
        query_embedding = self._embedding_model.encode(
            query,
            normalize_embeddings=False,
        ).tolist()

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
