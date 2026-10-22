from fastapi import APIRouter
from pydantic import BaseModel
import os, json, logging

logger = logging.getLogger(__name__)
router = APIRouter()

class EnhanceRequest(BaseModel):
    resume_json: dict
    job_description: str
    resume_text: str | None = None

class EnhanceResponse(BaseModel):
    enhanced_resume: dict
    ats_score_before: int
    ats_score_after: int
    changes: list[dict]   # [{section, field, before, after}]

@router.post("", response_model=EnhanceResponse)
async def enhance_resume(req: EnhanceRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return EnhanceResponse(
            enhanced_resume=req.resume_json,
            ats_score_before=50,
            ats_score_after=50,
            changes=[],
        )
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

        prompt = f"""You are an expert resume coach.
Given the resume JSON and the job description, produce a tailored version.

STRICT RULES:
- NEVER invent employers, degrees, schools, or projects the candidate didn't have.
- NEVER add skills the candidate doesn't already have listed. List them as gaps instead.
- Only rewrite bullet points with stronger action verbs and JD-relevant keywords.
- Reorder the skills list to put most-relevant first.
- Improve the summary to align with the job.
- Return a JSON object with: enhanced_resume (same schema as input), changes (list of {{section, field, before, after}}), ats_score_before (0-100), ats_score_after (0-100), gaps (list of skill strings the candidate is missing).

Job Description:
{req.job_description[:3000]}

Resume JSON:
{json.dumps(req.resume_json, indent=2)[:4000]}

Respond with pure JSON only."""

        resp = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        data = json.loads(resp.choices[0].message.content)
        return EnhanceResponse(
            enhanced_resume=data.get("enhanced_resume", req.resume_json),
            ats_score_before=data.get("ats_score_before", 50),
            ats_score_after=data.get("ats_score_after", 60),
            changes=data.get("changes", []),
        )
    except Exception as e:
        logger.error(f"Enhance failed: {e}")
        return EnhanceResponse(
            enhanced_resume=req.resume_json,
            ats_score_before=50,
            ats_score_after=50,
            changes=[],
        )
