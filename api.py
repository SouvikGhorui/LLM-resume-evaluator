from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from api_evaluator import evaluate_candidates_api

app = FastAPI(title="LLM Resume Evaluator API")

# Setup CORS for development purposes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directory exists
os.makedirs("static", exist_ok=True)

# Mount static files to serve the frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_index():
    with open("static/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/api/evaluate")
async def evaluate_resumes(
    job_description: str = Form(...),
    resumes: list[UploadFile] = File(...)
):
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty")
    
    if not resumes:
        raise HTTPException(status_code=400, detail="No resumes uploaded")

    # Read uploaded files into memory
    resume_files = []
    for resume in resumes:
        contents = await resume.read()
        resume_files.append((resume.filename, contents))
    
    try:
        # Call the core logic
        result = evaluate_candidates_api(job_description, resume_files)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
