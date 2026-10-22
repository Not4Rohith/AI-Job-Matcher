from sentence_transformers import SentenceTransformer
import numpy as np
import logging

logger = logging.getLogger(__name__)

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

class EmbedderModel:
    def __init__(self):
        logger.info(f"Loading {MODEL_NAME} ...")
        self.model = SentenceTransformer(MODEL_NAME)
        logger.info("Model loaded.")

    def embed(self, text: str) -> list[float]:
        """Return 384-dim embedding as a Python list."""
        vec = self.model.encode(text, normalize_embeddings=True)
        return vec.tolist()

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        vecs = self.model.encode(texts, normalize_embeddings=True, batch_size=32)
        return vecs.tolist()
