# LLM Resume Evaluator

An AI-powered resume evaluation system that uses LLMs (via Groq) to automatically parse job descriptions and candidate resumes, then scores candidates against job requirements with structured reasoning.

Built with **Groq (Llama-3.3-70B)**, **Pydantic** for structured output validation, **pypdf** & **python-docx** for document parsing, and **uv** for fast dependency management.

---

## 🎯 Features

| Feature | Description |
|---------|-------------|
| **📄 Multi-format Resume Parsing** | Parses both `.pdf` and `.docx` resumes using `pypdf` and `python-docx` |
| **📋 Structured JD Parsing** | Extracts structured job requirements (role, required/preferred skills, experience, education, responsibilities) using LLM + Pydantic schemas |
| **📊 Structured Resume Parsing** | Extracts candidate name, contact info, total experience, skills, experience history, projects, certifications |
| **🎯 Intelligent Scoring** | LLM evaluates candidate vs. job requirements and outputs: matching skills, missing skills, experience match, overall match %, and a verdict |
| **🏆 Ranked Results** | Outputs ranked candidates with top/bottom performers and detailed JSON reasoning |
| **📄 Multi-format Support** | Parses both `.pdf` (via `pypdf`) and `.docx` (via `python-docx`) including tables |
| **🔒 Structured Output** | Pydantic schemas enforce strict JSON output from LLM (no hallucinated fields) |
| ⚡ **Fast Inference** | Powered by Groq's Llama-3.3-70B-Versatile for sub-second inference |
| ⚡ **Fast Deps** | Uses `uv` for 10-100x faster dependency installs |

---

## 🏗 Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Job Description│     │   Resume Files   │     │   LLM (Groq)    │
│   (Raw Text)    │     │  (.pdf/.docx)    │     │  Llama-3.3-70B  │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  parse_job_     │     │  parse_resume()  │     │  score_candiate │
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

## 📦 Project Structure

```
llm-resume-evaluator/
│
├── .resumes/                    # Place candidate resumes here (.pdf/.docx) — gitignored
├── sample_resumes/              # Demo resume for testing
│   └── John_Doe_Demo_Resume.docx
│
├── evaluator.py                 # Main evaluation script
├── pyproject.toml               # uv project config & dependencies
├── .env.example                 # Environment variable template
├── .gitignore
└── README.md
```

---

## 🛠 Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Python** | ≥ 3.11 | [python.org](https://python.org) |
| **uv** | Latest | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| **Groq API Key** | Free tier | [console.groq.com](https://console.groq.com/keys) |

---

## 🚀 Quick Start

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

### 4. (Optional) Customize Job Description

Edit `evaluator.py` and replace the `raw_job_description` variable (around line 150) with your own job description.

### 5. Run Evaluation

```bash
uv run python evaluator.py
```

---

## 📊 Sample Output

```
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

---

## 📋 Output Schema (Structured JSON)

The LLM returns **strictly validated Pydantic models**:

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
    experiences: list[str] = []
    projects: list[str] = []
    certifications: list[str] = []

# Match Result Schema
class MatchResult(BaseModel):
    score: float
    details: dict  # Contains candidate_name, matching_skills, missing_important_skills, 
                   # experience_requirement_met, overall_match_percentage, final_verdict
```

---

## ⚙️ Configuration

| Setting | Location | Description |
|---------|----------|-------------|
| **Groq Model** | `evaluator.py:14` | Default: `llama-3.3-70b-versatile` |
| **Rate Limit Delay** | `evaluator.py:180,183` | `time.sleep(5)` between API calls (adjust for your rate limits) |
| **Job Description** | `evaluator.py:~150` | Replace `raw_job_description` string |
| **Resume Folder** | `evaluator.py:165` | Default: `Path('.resumes')` |
| **Top/Bottom N** | `evaluator.py:195-196` | Default: Top 2 & Bottom 2 |

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `groq` | Groq API client for LLM inference |
| `pydantic` | Structured output validation & schemas |
| `pypdf` | PDF text extraction |
| `python-docx` | DOCX text + table extraction |
| `python-dotenv` | Environment variable loading |

Install/update with:
```bash
uv sync          # Sync from pyproject.toml
uv add <pkg>     # Add new dependency
uv remove <pkg>  # Remove dependency
```

---

## 🎯 Customizing the Job Description

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

The LLM will automatically extract:
- **Role title**
- **Required skills** (must-haves)
- **Preferred skills** (nice-to-haves)
- **Minimum experience** (years)
- **Education requirements**
- **Key responsibilities**

---

## 📝 Sample Resume Format

The sample resume (`sample_resumes/John_Doe_Demo_Resume.docx`) demonstrates the expected structure. The parser extracts:

- **Contact info**: Name, email, phone
- **Total experience** (years, calculated from dates)
- **Skills** (technical + tools across entire resume)
- **Experience** (company, role, duration, description, skills used)
- **Projects** (name, description, tech stack)
- **Certifications**

> **Tip:** For best results, use standard resume formats with clear section headers (Experience, Skills, Projects, Education, Certifications).

---

## ⚙️ Rate Limits & Performance

| Tier | RPM | RPD | Notes |
|------|-----|-----|-------|
| Free | 30 | 14,400 | 5s delay = ~12 RPM, well within limits |
| Dev | 60 | 28,800 | Can reduce sleep to ~1-2s |
| Prod | 300+ | 1M+ | Adjust `time.sleep()` accordingly |

Current default: **5 second delay** between API calls (parsing resume + scoring = 2 calls per resume).

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `Api key not found!!` | Ensure `.env` exists with `GROQ_API_KEY=your_key` |
| `ModuleNotFoundError` | Run `uv sync` to install dependencies |
| `Directory .resumes is not present` | Run `mkdir -p .resumes` and add resumes |
| PDF text not extracting | Some PDFs are scanned images; use OCR first or provide DOCX |
| Rate limit errors | Increase `time.sleep(5)` in `evaluator.py` |
| JSON parsing errors | Groq sometimes returns malformed JSON; re-run or adjust prompt |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for blazing-fast LLM inference
- [Pydantic](https://docs.pydantic.dev/) for robust data validation
- [uv](https://github.com/astral-sh/uv) for lightning-fast package management
- [Llama 3.3](https://llama.meta.com/) by Meta

---

## 📧 Contact

**Your Name** - [@yourhandle](https://twitter.com/yourhandle) - email@example.com

Project Link: [https://github.com/your-username/llm-resume-evaluator](https://github.com/your-username/llm-resume-evaluator)