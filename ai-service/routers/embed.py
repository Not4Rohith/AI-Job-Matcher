from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()

class EmbedRequest(BaseModel):
    text: str

class EmbedBatchRequest(BaseModel):
    texts: list[str]

class EmbedResponse(BaseModel):
    embedding: list[float]
    dim: int

class EmbedBatchResponse(BaseModel):
    embeddings: list[list[float]]
    dim: int

@router.post("", response_model=EmbedResponse)
async def embed_text(req: EmbedRequest, request: Request):
    embedder = request.app.state.embedder
    vec = embedder.embed(req.text)
    return EmbedResponse(embedding=vec, dim=len(vec))

@router.post("/batch", response_model=EmbedBatchResponse)
async def embed_batch(req: EmbedBatchRequest, request: Request):
    embedder = request.app.state.embedder
    vecs = embedder.embed_batch(req.texts)
    return EmbedBatchResponse(embeddings=vecs, dim=len(vecs[0]) if vecs else 384)
