import os
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from rag import LectureAssistant

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

assistant = LectureAssistant()
current_pdf_path = None
current_language = "ru"


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
    return {"message": f"✅ PDF загружен. {len(assistant.chunks)} фрагментов."}


@app.post("/chat")
async def chat(question: str = Form(...), language: Optional[str] = Form(None)):
    global current_language
    if not assistant.is_loaded:
        return JSONResponse(status_code=400, content={"error": "❌ Сначала загрузите PDF"})

    lang = language if language in ["ru", "en", "ky"] else current_language
    answer = assistant.ask(question, lang)
    return {"answer": answer, "language": lang}


@app.post("/summarize")
async def summarize(language: Optional[str] = Form(None)):
    global current_language
    if not assistant.is_loaded:
        return JSONResponse(status_code=400, content={"error": "❌ Сначала загрузите PDF"})

    lang = language if language in ["ru", "en", "ky"] else current_language
    result = assistant.generate_summary(lang)
    return result


@app.post("/language")
async def set_language(lang: str = Form(...)):
    global current_language
    if lang in ["ru", "en", "ky"]:
        current_language = lang
        return {"message": f"🌐 Язык изменён на {lang}", "language": lang}
    return JSONResponse(status_code=400, content={"error": "Поддерживаются: ru, en, ky"})


@app.get("/ping")
def ping():
    return {"ping": "pong"}


@app.get("/health")
def health():
    return {"status": "ok", "pdf_loaded": assistant.is_loaded, "language": current_language}
