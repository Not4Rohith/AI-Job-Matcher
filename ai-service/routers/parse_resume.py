from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import os, json, logging

logger = logging.getLogger(__name__)
router = APIRouter()

class ParsedResume(BaseModel):
    contact: dict
    summary: str | None
    skills: list[str]
    experience: list[dict]
    education: list[dict]
    projects: list[dict]
    certifications: list[dict]
    raw_text: str

def extract_text(content: bytes, filename: str) -> str:
    """Extract text from PDF or DOCX bytes."""
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext == "pdf":
        try:
            import pdfplumber
            import io
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                return "\n".join(page.extract_text() or "" for page in pdf.pages)
        except Exception as e:
            logger.warning(f"pdfplumber failed: {e}")
            return ""
    elif ext in ("docx", "doc"):
        try:
            from docx import Document
            import io
            doc = Document(io.BytesIO(content))
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception as e:
            logger.warning(f"python-docx failed: {e}")
            return ""
    return ""

def parse_with_llm(raw_text: str) -> dict:
    """Use OpenAI to parse raw text into structured JSON. Fallback to heuristics."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return heuristic_parse(raw_text)
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        prompt = f"""Parse the following resume text into a JSON object with these fields:
contact (name, email, phone, location, linkedin, github), summary, skills (list of strings),
experience (list of {{company, title, start, end, bullets}}),
education (list of {{institution, degree, field, start, end, gpa}}),
projects (list of {{name, description, tech}}),
certifications (list of {{name, issuer, date}}).
Only include fields that are present. Respond with pure JSON.

Resume:
{raw_text[:6000]}"""
        resp = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            response_format={"type": "json_object"},
        )
        return json.loads(resp.choices[0].message.content)
    except Exception as e:
        logger.warning(f"LLM parse failed: {e}; falling back to heuristics")
        return heuristic_parse(raw_text)

def heuristic_parse(text: str) -> dict:
    """Minimal heuristic parser — returns partial structure."""
    import re
    emails = re.findall(r"[\w.+-]+@[\w-]+\.\w+", text)
    phones = re.findall(r"[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]", text)
    return {
        "contact": {
            "email": emails[0] if emails else None,
            "phone": phones[0] if phones else None,
        },
        "summary": None,
        "skills": [],
        "experience": [],
        "education": [],
        "projects": [],
        "certifications": [],
    }

@router.post("", response_model=ParsedResume)
async def parse_resume(file: UploadFile = File(...)):
    allowed_types = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Only PDF and DOCX are supported")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 5MB)")

    raw_text = extract_text(content, file.filename or "resume.pdf")
    parsed = parse_with_llm(raw_text)

    return ParsedResume(
        contact=parsed.get("contact", {}),
        summary=parsed.get("summary"),
        skills=parsed.get("skills", []),
        experience=parsed.get("experience", []),
        education=parsed.get("education", []),
        projects=parsed.get("projects", []),
        certifications=parsed.get("certifications", []),
        raw_text=raw_text,
    )
