import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import PyPDF2
import chromadb
from chromadb.utils import embedding_functions
import openai

app = FastAPI()

# Настройка OpenAI (ключ из .env файла)
openai.api_key = os.getenv("OPENAI_API_KEY")

# Настройка Chroma (векторная база данных)
chroma_client = chromadb.PersistentClient(path="./chroma_db")
embedding_fn = embedding_functions.OpenAIEmbeddingFunction(
    api_key=openai.api_key,
    model_name="text-embedding-3-small"
)

# Создаём коллекцию для лекций (если её нет)
try:
    collection = chroma_client.get_collection("lectures")
except:
    collection = chroma_client.create_collection(name="lectures", embedding_function=embedding_fn)

# Временное хранилище для ID текущего документа
current_doc_id = None

def extract_text_from_pdf(file_path: str) -> str:
    """Извлекает текст из PDF-файла"""
    text = ""
    with open(file_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text
    return text

def chunk_text(text: str, chunk_size: int = 500) -> list:
    """Разбивает текст на куски по chunk_size символов"""
    words = text.split()
    chunks = []
    current_chunk = []
    current_length = 0
    
    for word in words:
        current_length += len(word) + 1
        if current_length > chunk_size:
            chunks.append(" ".join(current_chunk))
            current_chunk = [word]
            current_length = len(word) + 1
        else:
            current_chunk.append(word)
    
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    return chunks

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Загружает PDF и индексирует его в Chroma"""
    global current_doc_id
    
    # Сохраняем загруженный файл временно
    file_path = f"temp_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    # Извлекаем текст
    text = extract_text_from_pdf(file_path)
    if not text:
        os.remove(file_path)
        return JSONResponse(status_code=400, content={"error": "Не удалось извлечь текст из PDF"})
    
    # Разбиваем на чанки
    chunks = chunk_text(text)
    
    # Генерируем ID для документа
    import uuid
    current_doc_id = str(uuid.uuid4())
    
    # Добавляем чанки в Chroma
    for i, chunk in enumerate(chunks):
        collection.add(
            documents=[chunk],
            ids=[f"{current_doc_id}_chunk_{i}"]
        )
    
    # Удаляем временный файл
    os.remove(file_path)
    
    return {"message": f"PDF загружен и проиндексирован. {len(chunks)} фрагментов.", "doc_id": current_doc_id}

@app.post("/chat")
async def chat(question: str = Form(...)):
    """Отвечает на вопрос на основе загруженной лекции"""
    if current_doc_id is None:
        return JSONResponse(status_code=400, content={"error": "Сначала загрузите PDF через /upload"})
    
    # Ищем похожие чанки в Chroma
    results = collection.query(query_texts=[question], n_results=5)
    
    if not results['documents'] or len(results['documents'][0]) == 0:
        return {"answer": "Не найдено информации по вашему вопросу в загруженной лекции."}
    
    # Собираем контекст из найденных чанков
    context = "\n\n".join(results['documents'][0])
    
    # Формируем промпт для OpenAI
    prompt = f"""Ты — ассистент по лекциям. Отвечай на вопрос, используя ТОЛЬКО следующий контекст.
Если ответа нет в контексте — скажи "Информация не найдена в лекции".

Контекст:
{context}

Вопрос: {question}

Ответ:"""

    # Запрашиваем ответ у OpenAI
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "Ты полезный ассистент, который отвечает только на основе предоставленного контекста."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )
    
    answer = response.choices[0].message.content
    return {"answer": answer}

@app.get("/ping")
def ping():
    return {"ping": "pong"}

@app.get("/")
def root():
    return {"message": "Campus Lecture Assistant API is running with RAG"}