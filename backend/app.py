import os
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from rag import LectureAssistant
from sqlalchemy.orm import Session
from pydantic import BaseModel

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

# Импорты для БД и авторизации
from database import create_tables, get_db, User, Lecture
from auth import hash_password, verify_password, create_access_token
from dependencies import get_current_user

# Создаем таблицы БД
create_tables()


# Pydantic модели для запросов
class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ===== AUTH ENDPOINTS =====
@app.post("/auth/register")
async def register(user_data: RegisterRequest, db: Session = Depends(get_db)):
    # Проверка существования пользователя
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        return JSONResponse(status_code=400, content={"error": "Email already exists"})

    # Создание пользователя
    hashed = hash_password(user_data.password)
    new_user = User(email=user_data.email, password_hash=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Создание токена
    token = create_access_token({"sub": str(new_user.id)})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/auth/login")
async def login(user_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        return JSONResponse(status_code=401, content={"error": "Invalid credentials"})

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "created_at": current_user.created_at}


# ===== LECTURE MANAGEMENT ENDPOINTS =====
@app.get("/lectures")
async def get_lectures(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    lectures = db.query(Lecture).filter(Lecture.user_id == current_user.id).all()
    return [
        {
            "id": lec.id,
            "filename": lec.filename,
            "uploaded_at": lec.uploaded_at,
            "file_path": lec.file_path
        }
        for lec in lectures
    ]


@app.delete("/lectures/{lecture_id}")
async def delete_lecture(
        lecture_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        return JSONResponse(status_code=404, content={"error": "Lecture not found"})

    if lecture.user_id != current_user.id:
        return JSONResponse(status_code=403, content={"error": "Access denied"})

    # Удаляем файл
    if os.path.exists(lecture.file_path):
        os.remove(lecture.file_path)

    db.delete(lecture)
    db.commit()

    return {"message": "Lecture deleted"}


# ===== EXISTING ENDPOINTS (UPDATED WITH AUTH) =====
@app.post("/upload")
async def upload_pdf(
        file: UploadFile = File(...),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    global current_pdf_path
    file_path = f"temp_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())
    success = assistant.load_pdf(file_path)
    if not success:
        os.remove(file_path)
        return JSONResponse(status_code=400, content={"error": "Не удалось загрузить PDF"})
    current_pdf_path = file_path

    # Сохраняем лекцию в БД
    new_lecture = Lecture(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path
    )
    db.add(new_lecture)
    db.commit()

    return {"message": f"✅ PDF загружен. {len(assistant.chunks)} фрагментов.", "lecture_id": new_lecture.id}


@app.post("/chat")
async def chat(
        question: str = Form(...),
        language: Optional[str] = Form(None),
        current_user: User = Depends(get_current_user)
):
    global current_language
    if not assistant.is_loaded:
        return JSONResponse(status_code=400, content={"error": "❌ Сначала загрузите PDF"})

    lang = language if language in ["ru", "en", "ky"] else current_language
    answer = assistant.ask(question, lang)

    # TODO: Сохранять историю чата в БД (потребуется lecture_id)

    return {"answer": answer, "language": lang}


@app.post("/summarize")
async def summarize(
        language: Optional[str] = Form(None),
        current_user: User = Depends(get_current_user)
):
    global current_language
    if not assistant.is_loaded:
        return JSONResponse(status_code=400, content={"error": "❌ Сначала загрузите PDF"})

    lang = language if language in ["ru", "en", "ky"] else current_language
    result = assistant.generate_summary(lang)
    return result


@app.post("/language")
async def set_language(
        lang: str = Form(...),
        current_user: User = Depends(get_current_user)
):
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