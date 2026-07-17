# LLM Resume Evaluator

An AI-powered resume evaluation system that uses LLMs (via Groq) to automatically parse job descriptions and candidate resumes, then scores candidates against job requirements with structured reasoning and ranked results.

Built with **Groq (Llama-3.3-70B-Versatile)**, **Pydantic** for structured output validation, **pypdf** & **python-docx** for document parsing, **FastAPI** for the REST API, and **uv** for fast dependency management.

---

## Features

| Feature | Description |
|---------|-------------|
| **Multi-format Resume Parsing** | Parses both `.pdf` (via `pypdf`) and `.docx` (via `python-docx` including tables) resumes |
| **Structured JD Parsing** | Extracts structured job requirements (role, required/preferred skills, experience, education, responsibilities) using LLM + Pydantic schemas |
| **Structured Resume Parsing** | Extracts candidate name, contact info, total experience, skills, experience history, projects, certifications |
| **Intelligent Scoring** | LLM evaluates candidate vs. job requirements and outputs: matching skills, missing skills, experience match, overall match %, and verdict |
| **Ranked Results** | Outputs ranked candidates with top/bottom performers and detailed JSON reasoning |
| **REST API** | FastAPI-based REST API with file upload support and CORS enabled |
| **Web UI** | Clean, responsive single-page frontend served by FastAPI (drag-drop file upload, paste support, keyboard accessible) |
| **Structured Output** | Pydantic schemas enforce strict JSON output from LLM (no hallucinated fields) |
| **Fast Inference** | Powered by Groq's Llama-3.3-70B-Versatile for sub-second inference |
| **Fast Deps** | Uses `uv` for 10-100x faster dependency installs |
| **Rate Limit Friendly** | Configurable delays between API calls to respect rate limits |

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Job Description│     │   Resume Files   │     │   LLM (Groq)    │
│   (Raw Text)    │     │   (.pdf/.docx)   │     │  Llama-3.3-70B  │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  parse_job_     │     │  parse_resume()  │     │  score_candidate│
│  description()  │     │  (PDF/DOCX +     │     │  (Job + Resume  │
│  → JobDesc      │     │   LLM → Resume)  │     │   → MatchResult)│
│  (Pydantic)     │     │  → Resume        │     │  → MatchResult  │
│                 │     │  (Pydantic)      │     │  (Pydantic)     │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         └───────────────────────┼────────────────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │   Ranked Results       │
                    │  • Top 2 Candidates    │
                    │  • Bottom 2 Candidates │
                    │  • Detailed JSON       │
                    └────────────────────────┘
```

---

## Project Structure

```
llm-resume-evaluator/
│
├── .resumes/                     # Place candidate resumes here (.pdf/.docx) — gitignored
├── sample_resumes/               # Demo resume for testing
│   └── John_Doe_Demo_Resume.docx
│
├── static/                       # Static web assets (served by FastAPI)
│   ├── index.html                # Single-page web UI
│   ├── style.css                 # Stylesheet
│   └── script.js                 # Frontend logic (drag-drop, paste, keyboard accessible)
│
├── api.py                        # FastAPI application entry point
├── api_evaluator.py              # Core evaluation logic (API version, no CLI prints)
├── evaluator.py                  # CLI evaluation script with sample JD
├── main.py                       # Package entry point (placeholder)
├── pyproject.toml                # Project config & dependencies (uv)
├── uv.lock                       # Locked dependencies
├── .env.example                  # Environment variable template
├── .gitignore
├── LICENSE
└── README.md
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Python** | ≥ 3.11 | [python.org](https://python.org) |
| **uv** | Latest | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| **Groq API Key** | Free tier | [console.groq.com/keys](https://console.groq.com/keys) |

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/llm-resume-evaluator.git
cd llm-resume-evaluator

# Install dependencies (creates .venv automatically)
uv sync
```

### 2. Configure API Key

```bash
# Copy the example and add your Groq API key
cp .env.example .env
# Edit .env and add: GROQ_API_KEY=your_groq_api_key_here
```

> Get a free API key at [console.groq.com/keys](https://console.groq.com/keys)

### 3. Add Resumes

```bash
# Create the resumes folder (gitignored)
mkdir -p .resumes

# Add candidate resumes (.pdf or .docx)
cp /path/to/resumes/*.pdf .resumes/
cp /path/to/resumes/*.docx .resumes/

# Or test with the sample resume
cp sample_resumes/John_Doe_Demo_Resume.docx .resumes/
```

### 4. Run Evaluation

#### Option A: CLI Script (with sample JD)

```bash
uv run python evaluator.py
```

#### Option B: REST API Server

```bash
# Start the FastAPI server
uv run python api.py

# Server runs at http://localhost:8000
# Web UI: http://localhost:8000
# API docs: http://localhost:8000/docs
```

#### Option C: Use as a Library

```python
from api_evaluator import evaluate_candidates_api

result = evaluate_candidates_api(
    job_description_text="Your job description here...",
    resume_files=[("resume1.pdf", pdf_bytes), ("resume2.docx", docx_bytes)]
)
```

---

## Sample Output

### CLI Output

```text
Parsing raw job description to the LLM
Target role = Data Engineer (Machine Learning Focus)
Minimum experience needed: 3.0
------------------------------------------------------------
Processing: John_Doe_Demo_Resume.docx 
Score for John Doe : 85.0

================ TOP 2 CANDIDATES ================
John Doe - 85.0%
{
  "candidate_name": "John Doe",
  "matching_skills": ["Machine Learning", "Python", "Data Pipelines", "SQL"],
  "missing_important_skills": ["Natural Language Processing", "MLOps"],
  "experience_requirement_met": true,
  "overall_match_percentage": 85,
  "final_verdict": "John has excellent foundational data engineering skills and relevant ML experience, making him a strong candidate despite lacking NLP and MLOps exposure."
}
```

### API Response

```json
{
  "success": true,
  "target_role": "Data Engineer (Machine Learning Focus)",
  "minimum_experience": 3.0,
  "top_candidates": [
    {
      "Name": "John Doe",
      "Score": 85.0,
      "details": {
        "candidate_name": "John Doe",
        "matching_skills": ["Machine Learning", "Python", "Data Pipelines", "SQL"],
        "missing_important_skills": ["Natural Language Processing", "MLOps"],
        "experience_requirement_met": true,
        "overall_match_percentage": 85,
        "final_verdict": "John has excellent foundational data engineering skills..."
      }
    }
  ],
  "lowest_candidates": [],
  "all_results": [...]
}
```

---

## Output Schema (Pydantic Models)

The LLM returns **strictly validated** Pydantic models:

```python
# Job Description Schema
class JobDescription(BaseModel):
    role: str
    required_skills: list[str]
    preferred_skills: list[str]
    minimum_experience: float | None
    educational_requirement: list[str]
    responsibilities: list[str]

# Resume Schema
class Resume(BaseModel):
    name: str | None
    email: str | None
    phone: str | None
    total_experience_year: float | None
    skills: list[str] = []
    experiences: list[str] = []        # Flattened strings from Experience model
    projects: list[str] = []
    certifications: list[str] = []

# Experience Detail (internal)
class Experience(BaseModel):
    company: str | None = None
    role: str | None = None
    duration: str | None = None
    description: str | None = None
    skills_used: list[str] = []

# Match Result Schema
class MatchResult(BaseModel):
    score: float
    details: dict  # Contains candidate_name, matching_skills, missing_important_skills,
                   # experience_requirement_met, overall_match_percentage, final_verdict
```

---

## Configuration

| Setting | Location | Default | Description |
|---------|----------|---------|-------------|
| **Groq Model** | `api_evaluator.py:14` / `evaluator.py:14` | `llama-3.3-70b-versatile` | LLM model for parsing & scoring |
| **Rate Limit Delay** | `api_evaluator.py:58,61` / `evaluator.py:180,183` | `2s` / `5s` | Delay between API calls (adjust for your tier) |
| **Job Description** | `evaluator.py:~150` | Sample IBM JD | Replace `raw_job_description` string |
| **Resume Folder** | `evaluator.py:165` | `Path('.resumes')` | Directory containing resume files |
| **Top/Bottom N** | `evaluator.py:195-196` | Top 2 / Bottom 2 | Number of top/bottom candidates to display |

### Groq Rate Limits

| Tier | RPM | RPD | Recommended Delay |
|------|-----|-----|-------------------|
| Free | 30 | 14,400 | 5s (≈12 RPM) |
| Dev | 60 | 28,800 | 1-2s |
| Prod | 300+ | 1M+ | Adjust as needed |

---

## Web UI Features

The included single-page frontend (`static/index.html`) provides:

- **Drag & Drop** file upload (PDF/DOCX)
- **Paste Support** — paste files from clipboard
- **Keyboard Accessible** — focusable drop zone, Enter/Space to open file dialog
- **Real-time Validation** — file type/size checks
- **Loading States** — progress indication during evaluation
- **Results Display** — ranked cards with scores, matching/missing skills, verdicts
- **Responsive Design** — works on mobile and desktop

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serves the web UI |
| `POST` | `/api/evaluate` | Evaluate resumes against a job description |

### `/api/evaluate` Request

```bash
curl -X POST http://localhost:8000/api/evaluate \
  -F "job_description=Your job description here..." \
  -F "resumes=@resume1.pdf" \
  -F "resumes=@resume2.docx"
```

### Response

```json
{
  "success": true,
  "target_role": "Data Engineer",
  "minimum_experience": 3.0,
  "top_candidates": [...],
  "lowest_candidates": [...],
  "all_results": [...]
}
```

---

## Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `groq` | Groq API client | ≥1.5.0 |
| `pydantic` | Data validation & schemas | ≥2.13.4 |
| `pypdf` | PDF text extraction | ≥6.14.2 |
| `python-docx` | DOCX text & table extraction | ≥1.2.0 |
| `python-dotenv` | Environment variable loading | ≥1.2.2 |
| `fastapi` | Web framework | ≥0.100.0 |
| `uvicorn` | ASGI server | ≥0.22.0 |
| `python-multipart` | Form/file upload support | (transitive) |

Manage with `uv`:

```bash
uv sync          # Sync from pyproject.toml
uv add <pkg>     # Add dependency
uv remove <pkg>  # Remove dependency
uv lock          # Regenerate lockfile
```

---

## Customizing the Job Description

Edit the `raw_job_description` string in `evaluator.py` (around line 150):

```python
raw_job_description = """
Your Company Job Description Here...

Required Skills:
- Python, SQL, AWS
- 3+ years experience
...
"""
```

The LLM automatically extracts:
- **Role title**
- **Required skills** (must-haves)
- **Preferred skills** (nice-to-haves)
- **Minimum experience** (years)
- **Education requirements**
- **Key responsibilities**

---

## Sample Resume Format

The sample resume (`sample_resumes/John_Doe_Demo_Resume.docx`) demonstrates the expected structure. The parser extracts:

- **Contact info**: Name, email, phone
- **Total experience** (years, calculated from dates)
- **Skills** (technical + tools across entire resume)
- **Experience** (company, role, duration, description, skills used — includes internships)
- **Projects** (name, description, tech stack)
- **Certifications**

> **Tip:** For best results, use standard resume formats with clear section headers (Experience, Skills, Projects, Education, Certifications).

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Api key not found!!` | Ensure `.env` exists with `GROQ_API_KEY=your_key` |
| `ModuleNotFoundError` | Run `uv sync` to install dependencies |
| `Directory .resumes is not present` | Run `mkdir -p .resumes` and add resumes |
| PDF text not extracting | Some PDFs are scanned images; use OCR first or provide DOCX |
| Rate limit errors | Increase `time.sleep()` in `evaluator.py` / `api_evaluator.py` |
| JSON parsing errors | Groq occasionally returns malformed JSON; re-run or adjust prompt |
| Empty resume text | Check file isn't corrupted/encrypted; try DOCX instead |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [Groq](https://groq.com/) for blazing-fast LLM inference
- [Pydantic](https://docs.pydantic.dev/) for robust data validation
- [uv](https://github.com/astral-sh/uv) for lightning-fast package management
- [Llama 3.3](https://llama.meta.com/) by Meta
- [FastAPI](https://fastapi.tiangolo.com/) for the modern web framework
