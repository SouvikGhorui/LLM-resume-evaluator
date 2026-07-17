# LLM Resume Evaluator 🚀

An intelligent, AI-powered command-line application that automates the recruitment process by evaluating candidate resumes against a specific job description. 

Built with **Python**, **Pydantic**, and the **Groq API** (powered by Meta's Llama-3 70B model), this tool extracts structured data from candidate resumes (PDF or Word formats), compares their skills and experiences to your requirements, and scores them automatically.

---

## ✨ Key Features

- **Automated Resume Parsing**: Extracts name, contact info, total experience, skills, and past experiences from both `.pdf` and `.docx` files.
- **Intelligent Scoring**: Uses LLMs to generate an overall match percentage (`0-100%`) by understanding context, not just keyword matching.
- **Detailed Insights**: Outputs matching skills, missing critical skills, and a short, readable verdict on why the candidate is (or isn't) a good fit.
- **Candidate Ranking**: Automatically ranks candidates and groups them into top performers and lowest matches.
- **Privacy First**: Designed to ignore your `.resumes/` folder in git history, ensuring sensitive candidate data is never exposed.

---

## 📋 Prerequisites

Before you begin, ensure you have met the following requirements:
* You have installed [Python 3.10+](https://www.python.org/downloads/).
* You have installed [uv](https://docs.astral.sh/uv/) (an extremely fast Python package and project manager).
* You have a [Groq API Key](https://console.groq.com/keys) (Free to generate).

---

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YourUsername/LLM-resume-evaluator.git
   cd LLM-resume-evaluator
   ```

2. **Set up your Environment Variables**
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Open the `.env` file and replace the placeholder with your actual Groq API key:
     ```env
     GROQ_API_KEY=your_actual_api_key_here
     ```

3. **Install Dependencies using `uv`**
   ```bash
   uv sync
   ```
   *(This will automatically create a `.venv` virtual environment and install dependencies like `pydantic`, `groq`, `pypdf`, and `python-docx`)*

---

## 💻 Usage

1. **Add Resumes to evaluate**
   - Create a `.resumes` folder in the root directory (if it doesn't already exist).
   - Place all candidate `.pdf` and `.docx` files into this folder.
   - *Note: We have provided a demo resume in the `sample_resumes/` folder. You can copy it into your `.resumes/` folder to test the system!*

2. **Customize the Job Description (Optional)**
   - Open `evaluator.py` in your text editor.
   - Locate the `raw_job_description` variable (around line 180) and paste your own company's job description.

3. **Run the Evaluator**
   ```bash
   uv run python evaluator.py
   ```

4. **Review the Results**
   The script will print out the target role, iterate over every candidate resume, and output a structured JSON evaluation ranking your top and bottom candidates. 

   **Example Output:**
   ```json
   ================ TOP 2 CANDIDATES ================
   John Doe - 85.0%
   {
     "candidate_name": "John Doe",
     "matching_skills": ["Machine Learning", "Python", "Data Pipelines"],
     "missing_important_skills": ["Natural Language Processing"],
     "experience_requirement_met": true,
     "overall_match_percentage": 85,
     "final_verdict": "John has excellent foundational data engineering skills and relevant experience, making him a strong candidate despite lacking NLP."
   }
   ```

---

## 📂 Project Structure

```text
LLM-resume-evaluator/
│
├── .resumes/                 # Place real candidate resumes here (Ignored by Git)
├── sample_resumes/           # Contains a demo resume for testing
├── evaluator.py              # Main evaluation script 
├── pyproject.toml            # uv project configuration and dependencies
├── .env.example              # Template for environment variables
└── README.md                 # Project documentation
```

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/YourUsername/LLM-resume-evaluator/issues). 

## 📝 License
This project is open source and available under the [MIT License](LICENSE).
