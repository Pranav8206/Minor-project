from functools import lru_cache

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
