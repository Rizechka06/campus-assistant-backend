import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from rag import LectureAssistant

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
assistant = LectureAssistant()
current_pdf_path = None

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global current_pdf_path
    file_path = f"temp_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())
    success = assistant.load_pdf(file_path)
    if not success:
        os.remove(file_path)
        return JSONResponse(status_code=400, content={"error": "Не удалось загрузить PDF"})
    current_pdf_path = file_path
    return {"message": f"PDF загружен. {len(assistant.chunks)} фрагментов.", "doc_id": "openrouter"}

@app.post("/chat")
async def chat(question: str = Form(...)):
    if not assistant.is_loaded:
        return JSONResponse(status_code=400, content={"error": "Сначала загрузите PDF"})
    answer = assistant.ask(question)
    return {"answer": answer}

@app.get("/ping")
def ping():
    return {"ping": "pong"}