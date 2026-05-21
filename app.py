from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import uuid
import os

# ===== БАЗА ДАННЫХ =====
SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class PDFDocument(Base):
    __tablename__ = "pdfs"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    doc_id = Column(String, unique=True, index=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ===== СЕРВЕР =====
app = FastAPI(title="Campus Assistant Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Hello World"}


@app.get("/ping")
def ping():
    return {"ping": "pong"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(400, "Только PDF файлы")

    doc_id = str(uuid.uuid4())
    content = await file.read()

    pdf_doc = PDFDocument(filename=file.filename, doc_id=doc_id)
    db.add(pdf_doc)
    db.commit()
    db.refresh(pdf_doc)

    return {
        "message": "PDF загружен",
        "doc_id": doc_id,
        "db_id": pdf_doc.id,
        "filename": file.filename,
        "size_bytes": len(content)
    }


@app.get("/documents")
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(PDFDocument).all()
    return {"documents": [{"id": d.id, "filename": d.filename, "uploaded_at": d.uploaded_at.isoformat()} for d in docs]}


@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    count = db.query(PDFDocument).count()
    return {"total_documents": count}


@app.post("/chat")
async def chat(question: str):
    return {"answer": f"Здравствуй, Вы спросили: {question}"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)