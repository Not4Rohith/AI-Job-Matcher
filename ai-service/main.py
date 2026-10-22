from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import logging
from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

try:
    import google.generativeai as genai
except ImportError:
    genai = None

embedder = None
if os.getenv("ENABLE_LOCAL_EMBEDDER", "false").lower() == "true":
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("Loading sentence-transformers model...")
        embedder = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Model loaded.")
    except Exception as e:
        logger.warning(f"SentenceTransformer not loaded ({e}). Using hash-based embedding fallback.")
        embedder = None
else:
    logger.info("SentenceTransformer disabled. Using fast hash-based embedding fallback.")

# Load Gemini
gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key and genai:
    genai.configure(api_key=gemini_key)

def heuristic_parse(text: str) -> dict:
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

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

def _generate_vector(text: str) -> list:
    if embedder is not None:
        return embedder.encode(text).tolist()
    import hashlib, math
    h = hashlib.sha256(text.encode("utf-8")).digest()
    vec = [(b / 255.0 - 0.5) for b in (h * 12)[:384]]
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [round(x / norm, 6) for x in vec]

@app.route("/embed", methods=["POST"])
def embed_text():
    req = request.json or {}
    text = req.get("text", "")
    vec = _generate_vector(text)
    return jsonify({"embedding": vec, "dim": len(vec)})

@app.route("/embed/batch", methods=["POST"])
def embed_batch():
    req = request.json or {}
    texts = req.get("texts", [])
    if not texts:
        return jsonify({"embeddings": [], "dim": 384})
    vecs = [_generate_vector(t) for t in texts]
    return jsonify({"embeddings": vecs, "dim": len(vecs[0])})

@app.route("/parse-resume", methods=["POST"])
def parse_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    filename = file.filename
    content = file.read()
    
    ext = filename.rsplit(".", 1)[-1].lower()
    raw_text = ""
    if ext == "pdf":
        import pdfplumber
        import io
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                raw_text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        except Exception as e:
            logger.warning(f"pdfplumber failed: {e}")
    elif ext in ("docx", "doc"):
        import io
        from docx import Document
        try:
            doc = Document(io.BytesIO(content))
            raw_text = "\n".join(p.text for p in doc.paragraphs)
        except Exception as e:
            logger.warning(f"python-docx failed: {e}")

    if not gemini_key:
        parsed = heuristic_parse(raw_text)
    else:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""Parse the following resume text into a JSON object with these fields:
contact (name, email, phone, location, linkedin, github), summary, skills (list of strings),
experience (list of {{company, title, start, end, bullets}}),
education (list of {{institution, degree, field, start, end, gpa}}),
projects (list of {{name, description, tech}}),
certifications (list of {{name, issuer, date}}).
Only include fields that are present. Respond with pure JSON.

Resume:
{raw_text[:10000]}"""
            resp = model.generate_content(prompt, generation_config=genai.GenerationConfig(response_mime_type="application/json"))
            parsed = json.loads(resp.text)
        except Exception as e:
            logger.warning(f"Gemini parse failed: {e}; falling back to heuristics")
            parsed = heuristic_parse(raw_text)
            
    return jsonify({
        "contact": parsed.get("contact", {}),
        "summary": parsed.get("summary"),
        "skills": parsed.get("skills", []),
        "experience": parsed.get("experience", []),
        "education": parsed.get("education", []),
        "projects": parsed.get("projects", []),
        "certifications": parsed.get("certifications", []),
        "raw_text": raw_text
    })

@app.route("/enhance", methods=["POST"])
def enhance_resume():
    req = request.json
    resume_json = req.get("resume_json", {})
    job_desc = req.get("job_description", "")
    
    if not gemini_key:
        return jsonify({
            "enhanced_resume": resume_json,
            "ats_score_before": 50,
            "ats_score_after": 50,
            "changes": []
        })
        
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
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
{job_desc[:4000]}

Resume JSON:
{json.dumps(resume_json)[:6000]}

Respond with pure JSON only."""
        resp = model.generate_content(prompt, generation_config=genai.GenerationConfig(response_mime_type="application/json"))
        data = json.loads(resp.text)
        return jsonify({
            "enhanced_resume": data.get("enhanced_resume", resume_json),
            "ats_score_before": data.get("ats_score_before", 50),
            "ats_score_after": data.get("ats_score_after", 60),
            "changes": data.get("changes", [])
        })
    except Exception as e:
        logger.error(f"Enhance failed: {e}")
        return jsonify({
            "enhanced_resume": resume_json,
            "ats_score_before": 50,
            "ats_score_after": 50,
            "changes": []
        })

@app.route("/skills/extract", methods=["POST"])
def extract_skills():
    req = request.json
    text = req.get("text", "")
    if gemini_key:
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"Extract all technical and professional skills from this text as a JSON array of strings named 'skills'. Normalize them (e.g. 'JS' -> 'JavaScript'). Text:\n{text[:4000]}"
            resp = model.generate_content(prompt, generation_config=genai.GenerationConfig(response_mime_type="application/json"))
            data = json.loads(resp.text)
            skills = data.get("skills", [])
            return jsonify({"skills": [str(s) for s in skills]})
        except Exception as e:
            logger.warning(f"LLM skill extraction failed: {e}")
            
    common_skills = [
        "Python", "Java", "JavaScript", "TypeScript", "React", "Node.js",
        "Spring Boot", "SQL", "PostgreSQL", "MongoDB", "Docker", "Kubernetes",
        "AWS", "GCP", "Azure", "Git", "REST API", "GraphQL", "FastAPI",
        "Machine Learning", "TensorFlow", "PyTorch", "NLP", "Agile", "Scrum",
    ]
    text_lower = text.lower()
    found = [s for s in common_skills if s.lower() in text_lower]
    return jsonify({"skills": found})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
