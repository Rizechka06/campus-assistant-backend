# -*- coding: utf-8 -*-
import os
import json
import re
import sqlite3
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from openai import OpenAI

load_dotenv()

# Путь к базе данных
DB_PATH = os.path.join(os.path.dirname(__file__), "lectures.db")

def save_summary_to_db(user_id: int, lecture_id: int, summary_text: str, language: str):
    """Сохраняет конспект в базу данных"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO chat_history (user_id, lecture_id, question, answer, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        """, (user_id, lecture_id, f"[SUMMARY_{language}]", summary_text))
        conn.commit()
        conn.close()
        print(f"💾 Конспект сохранён в БД для lecture_id={lecture_id}")
    except Exception as e:
        print(f"⚠️ Ошибка сохранения конспекта: {e}")

def save_chat_to_db(user_id: int, lecture_id: int, question: str, answer: str):
    """Сохраняет вопрос и ответ в базу данных"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO chat_history (user_id, lecture_id, question, answer, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        """, (user_id, lecture_id, question, answer))
        conn.commit()
        conn.close()
        print(f"💾 Вопрос сохранён в БД для lecture_id={lecture_id}")
    except Exception as e:
        print(f"⚠️ Ошибка сохранения чата: {e}")

# Настройки OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    print("❌ ОШИБКА: OPENROUTER_API_KEY не найден в файле .env")
    OPENROUTER_API_KEY = "missing_key"

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

MODEL_NAME = "openrouter/free"


class LectureAssistant:
    def __init__(self):
        self.chunks = []
        self.is_loaded = False
        self.current_pdf = None
        self.current_lecture_id = None
        self.current_user_id = None
        print("🤖 Ассистент готов к работе (OpenRouter)")

    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        try:
            reader = PdfReader(pdf_path)
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    page_text = page_text.encode('utf-8', errors='ignore').decode('utf-8')
                    text_parts.append(page_text)
            text = "".join(text_parts)
            print(f"📄 Извлечено {len(text)} символов из {pdf_path}")
            return text
        except Exception as e:
            print(f"❌ Ошибка при чтении PDF: {e}")
            return ""

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 500) -> list:
        chunks = []
        for i in range(0, len(text), chunk_size):
            chunk = text[i:i + chunk_size]
            if len(chunk.strip()) > 50:
                chunks.append({"id": len(chunks), "text": chunk})
        print(f"✂️ Текст разбит на {len(chunks)} фрагментов")
        return chunks

    def load_pdf(self, pdf_path: str, lecture_id: int = None, user_id: int = None) -> bool:
        if not os.path.exists(pdf_path):
            print(f"❌ Файл не найден: {pdf_path}")
            return False

        text = self.extract_text_from_pdf(pdf_path)
        if not text:
            return False

        self.chunks = self.chunk_text(text)
        self.is_loaded = True
        self.current_pdf = pdf_path
        self.current_lecture_id = lecture_id
        self.current_user_id = user_id
        print(f"✅ Лекция загружена! {len(self.chunks)} фрагментов")
        return True

    def _find_relevant_chunks(self, query: str, top_k: int = 5) -> list:
        query = query.encode('utf-8', errors='ignore').decode('utf-8')
        query_words = set(query.lower().split())
        scored_chunks = []
        for chunk in self.chunks:
            chunk_words = set(chunk["text"].lower().split())
            score = len(query_words & chunk_words)
            if score > 0:
                scored_chunks.append((score, chunk))
        scored_chunks.sort(reverse=True, key=lambda x: x[0])
        top_chunks = [chunk for score, chunk in scored_chunks[:top_k]]
        if not top_chunks:
            top_chunks = self.chunks[:top_k]
        print(f"🔍 Найдено {len(top_chunks)} релевантных фрагментов")
        return top_chunks

    def generate_summary(self, language: str = "ru", user_id: int = None, lecture_id: int = None) -> dict:
        if not self.is_loaded:
            return {
                "title": "Ошибка",
                "key_topics": [],
                "key_terms": [],
                "main_conclusions": ["Сначала загрузите PDF"]
            }

        full_text = " ".join([chunk["text"] for chunk in self.chunks])
        full_text = full_text[:8000]
        full_text = full_text.encode('utf-8', errors='ignore').decode('utf-8')

        if language == "ru":
            prompt = f"""Ты ассистент. Создай конспект НА РУССКОМ ЯЗЫКЕ.

Текст лекции:
{full_text}

Верни ТОЛЬКО JSON:
{{
    "title": "название на русском",
    "key_topics": ["тема 1", "тема 2"],
    "key_terms": [{{"term": "термин", "definition": "определение"}}],
    "main_conclusions": ["вывод 1", "вывод 2"]
}}

Только JSON."""
        elif language == "en":
            prompt = f"""You are an assistant. Create a summary IN ENGLISH. Translate everything.

Lecture text:
{full_text}

Return ONLY JSON:
{{
    "title": "English title",
    "key_topics": ["topic 1", "topic 2"],
    "key_terms": [{{"term": "term", "definition": "definition"}}],
    "main_conclusions": ["conclusion 1", "conclusion 2"]
}}

Only JSON."""
        elif language == "ky":
            prompt = f"""Сен жардамчысын. КЫРГЫЗ ТИЛИНДЕ конспект түзгүлө.

Лекциянын тексти:
{full_text}

ТЕК JSON:
{{
    "title": "кыргызча аты",
    "key_topics": ["тема 1", "тема 2"],
    "key_terms": [{{"term": "кыргызча термин", "definition": "кыргызча аныктама"}}],
    "main_conclusions": ["кыргызча жыйынтык 1", "кыргызча жыйынтык 2"]
}}

Тек JSON."""
        else:
            prompt = f"""Ты ассистент. Создай конспект НА РУССКОМ ЯЗЫКЕ.

Текст лекции:
{full_text}

Верни ТОЛЬКО JSON:
{{
    "title": "название",
    "key_topics": ["тема 1", "тема 2"],
    "key_terms": [{{"term": "термин", "definition": "определение"}}],
    "main_conclusions": ["вывод 1", "вывод 2"]
}}

Только JSON."""

        try:
            completion = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                extra_headers={
                    "HTTP-Referer": "http://localhost",
                    "X-Title": "Campus Lecture Assistant",
                }
            )

            answer = completion.choices[0].message.content
            answer = answer.encode('utf-8', errors='ignore').decode('utf-8')

            json_match = re.search(r'\{.*\}', answer, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                default = {"title": "Лекция", "key_topics": [], "key_terms": [], "main_conclusions": []}
                default.update(result)
                
                if user_id and lecture_id:
                    summary_text = json.dumps(result, ensure_ascii=False)
                    save_summary_to_db(user_id, lecture_id, summary_text, language)
                
                return default
            else:
                return {
                    "title": "Ошибка парсинга",
                    "key_topics": [],
                    "key_terms": [],
                    "main_conclusions": [answer[:200]]
                }

        except Exception as e:
            return {
                "title": "Ошибка",
                "key_topics": [],
                "key_terms": [],
                "main_conclusions": [f"Ошибка: {str(e)}"]
            }

    def ask(self, question: str, language: str = "ru", user_id: int = None, lecture_id: int = None) -> str:
        if not self.is_loaded:
            return "❌ Сначала загрузите лекцию"

        question = question.encode('utf-8', errors='ignore').decode('utf-8')
        relevant_chunks = self._find_relevant_chunks(question)
        context = "\n\n---\n\n".join([chunk["text"] for chunk in relevant_chunks])
        context = context.encode('utf-8', errors='ignore').decode('utf-8')

        if language == "ru":
            system_prompt = "Ты ассистент по лекциям. Отвечай кратко по тексту. Если нет - скажи 'Не найдено'."
            user_prompt = f"Лекция:\n{context}\n\nВопрос: {question}\n\nОтвет:"
        elif language == "en":
            system_prompt = "You are a lecture assistant. Answer briefly. If not found - say 'Not found'."
            user_prompt = f"Lecture:\n{context}\n\nQuestion: {question}\n\nAnswer:"
        elif language == "ky":
            system_prompt = "Сен лекция боюнча жардамчысын. Кыскача жооп бер. Жок болсо - 'Табылган жок' де."
            user_prompt = f"Лекция:\n{context}\n\nСуроо: {question}\n\nЖооп:"
        else:
            system_prompt = "Ты ассистент по лекциям. Отвечай кратко."
            user_prompt = f"Лекция:\n{context}\n\nВопрос: {question}\n\nОтвет:"

        try:
            completion = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                extra_headers={
                    "HTTP-Referer": "http://localhost",
                    "X-Title": "Campus Lecture Assistant",
                }
            )
            answer = completion.choices[0].message.content
            answer = answer.encode('utf-8', errors='ignore').decode('utf-8')
            
            if user_id and lecture_id:
                save_chat_to_db(user_id, lecture_id, question, answer)
            
            return answer
        except Exception as e:
            return f"❌ Ошибка: {str(e)}"


def main():
    assistant = LectureAssistant()
    try:
        test_response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": "Ответь 'OK'"}],
            extra_headers={
                "HTTP-Referer": "http://localhost",
                "X-Title": "Campus Lecture Assistant",
            }
        )
        print(f"✅ OpenRouter работает! Ответ: {test_response.choices[0].message.content}")
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")


if __name__ == "__main__":
    main()
