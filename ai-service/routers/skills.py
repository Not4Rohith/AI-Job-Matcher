from fastapi import APIRouter
from pydantic import BaseModel
import os, json, logging, re

logger = logging.getLogger(__name__)
router = APIRouter()

class ExtractRequest(BaseModel):
    text: str

class ExtractResponse(BaseModel):
    skills: list[str]

@router.post("/extract", response_model=ExtractResponse)
async def extract_skills(req: ExtractRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content":
                    f"Extract all technical and professional skills from this text as a JSON array of strings. "
                    f"Normalize them (e.g. 'JS' -> 'JavaScript'). Text:\n{req.text[:3000]}"}],
                temperature=0,
                response_format={"type": "json_object"},
            )
            data = json.loads(resp.choices[0].message.content)
            skills = data.get("skills", data.get("skill_list", []))
            return ExtractResponse(skills=[str(s) for s in skills])
        except Exception as e:
            logger.warning(f"LLM skill extraction failed: {e}")

    # Fallback: keyword matching
    common_skills = [
        "Python", "Java", "JavaScript", "TypeScript", "React", "Node.js",
        "Spring Boot", "SQL", "PostgreSQL", "MongoDB", "Docker", "Kubernetes",
        "AWS", "GCP", "Azure", "Git", "REST API", "GraphQL", "FastAPI",
        "Machine Learning", "TensorFlow", "PyTorch", "NLP", "Agile", "Scrum",
    ]
    text_lower = req.text.lower()
    found = [s for s in common_skills if s.lower() in text_lower]
    return ExtractResponse(skills=found)
