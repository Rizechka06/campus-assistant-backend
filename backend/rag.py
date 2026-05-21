# -*- coding: utf-8 -*-
import os
import json
import re
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from openai import OpenAI

load_dotenv()

# Настройки OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    print("❌ ОШИБКА: OPENROUTER_API_KEY не найден в файле .env")
    print("Добавьте строку: OPENROUTER_API_KEY=sk-or-v1-ваш_ключ")
    OPENROUTER_API_KEY = "missing_key"

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

# Бесплатный роутер OpenRouter
MODEL_NAME = "openrouter/free"


class LectureAssistant:
    def __init__(self):
        self.chunks = []
        self.is_loaded = False
        self.current_pdf = None
        print("🤖 Ассистент готов к работе (OpenRouter)")

    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        try:
            reader = PdfReader(pdf_path)
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    # Принудительно переводим в UTF-8
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

    def load_pdf(self, pdf_path: str) -> bool:
        if not os.path.exists(pdf_path):
            print(f"❌ Файл не найден: {pdf_path}")
            return False

        text = self.extract_text_from_pdf(pdf_path)
        if not text:
            return False

        self.chunks = self.chunk_text(text)
        self.is_loaded = True
        self.current_pdf = pdf_path
        print(f"✅ Лекция загружена! {len(self.chunks)} фрагментов")
        return True

    def _find_relevant_chunks(self, query: str, top_k: int = 5) -> list:
        # Принудительно переводим запрос в UTF-8
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

    def generate_summary(self, language: str = "ru") -> dict:
        """
        Возвращает структурированный конспект лекции в виде JSON
        """
        if not self.is_loaded:
            return {
                "title": "Ошибка",
                "key_topics": [],
                "key_terms": [],
                "main_conclusions": ["Сначала загрузите PDF через load_pdf()"]
            }

        # Собираем весь текст из чанков
        full_text = " ".join([chunk["text"] for chunk in self.chunks])
        full_text = full_text[:8000]
        # Принудительно переводим в UTF-8
        full_text = full_text.encode('utf-8', errors='ignore').decode('utf-8')

        # Промпты на разных языках (с кодировкой)
        if language == "ru":
            prompt = f"""Ты ассистент. Проанализируй лекцию и верни ТОЛЬКО JSON без пояснений.

Вот текст лекции:
{full_text}

Верни JSON в точном формате:
{{
    "title": "краткое название лекции",
    "key_topics": ["тема 1", "тема 2", "тема 3"],
    "key_terms": [
        {{"term": "термин 1", "definition": "определение 1"}},
        {{"term": "термин 2", "definition": "определение 2"}}
    ],
    "main_conclusions": ["вывод 1", "вывод 2", "вывод 3"]
}}

Только JSON, ничего другого."""

        elif language == "en":
            prompt = f"""You are an assistant. Analyze the lecture and return ONLY JSON.

Lecture text:
{full_text}

Return JSON in this exact format:
{{
    "title": "short lecture title",
    "key_topics": ["topic 1", "topic 2", "topic 3"],
    "key_terms": [
        {{"term": "term 1", "definition": "definition 1"}},
        {{"term": "term 2", "definition": "definition 2"}}
    ],
    "main_conclusions": ["conclusion 1", "conclusion 2", "conclusion 3"]
}}

Only JSON, nothing else."""

        elif language == "ky":
            prompt = f"""Сен жардамчысын. Лекцияны талдап, ТЕК JSON кайтар.

Лекциянын тексти:
{full_text}

Такыр ушул форматта JSON кайтар:
{{
    "title": "лекциянын кыскача аты",
    "key_topics": ["тема 1", "тема 2", "тема 3"],
    "key_terms": [
        {{"term": "термин 1", "definition": "аныктама 1"}},
        {{"term": "термин 2", "definition": "аныктама 2"}}
    ],
    "main_conclusions": ["жыйынтык 1", "жыйынтык 2", "жыйынтык 3"]
}}

Тек JSON, башка эч нерсе."""

        else:
            prompt = f"""Ты ассистент. Проанализируй лекцию и верни ТОЛЬКО JSON без пояснений.

Вот текст лекции:
{full_text}

Верни JSON в точном формате:
{{
    "title": "краткое название лекции",
    "key_topics": ["тема 1", "тема 2", "тема 3"],
    "key_terms": [
        {{"term": "термин 1", "definition": "определение 1"}},
        {{"term": "термин 2", "definition": "определение 2"}}
    ],
    "main_conclusions": ["вывод 1", "вывод 2", "вывод 3"]
}}

Только JSON, ничего другого."""

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

            # Ищем JSON в ответе
            json_match = re.search(r'\{.*\}', answer, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                default = {"title": "Лекция", "key_topics": [], "key_terms": [], "main_conclusions": []}
                default.update(result)
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

    def ask(self, question: str, language: str = "ru") -> str:
        """Задаёт вопрос к загруженной лекции с учётом языка"""
        if not self.is_loaded:
            return "❌ Сначала загрузите лекцию через load_pdf()"

        # Принудительно переводим вопрос в UTF-8
        question = question.encode('utf-8', errors='ignore').decode('utf-8')
        
        relevant_chunks = self._find_relevant_chunks(question)
        context = "\n\n---\n\n".join([chunk["text"] for chunk in relevant_chunks])
        context = context.encode('utf-8', errors='ignore').decode('utf-8')

        # Промпты на разных языках
        if language == "ru":
            system_prompt = "Ты ассистент по лекциям. Отвечай кратко, только на основе текста. Если ответа нет - скажи 'Не найдено в лекции'."
            user_prompt = f"Лекция:\n{context}\n\nВопрос: {question}\n\nОтвет:"

        elif language == "en":
            system_prompt = "You are a lecture assistant. Answer briefly based only on the text. If not found - say 'Not found in the lecture'."
            user_prompt = f"Lecture:\n{context}\n\nQuestion: {question}\n\nAnswer:"

        elif language == "ky":
            system_prompt = "Сен лекция боюнча жардамчысын. Тексттин негизинде гана кыскача жооп бер. Жок болсо - 'Лекциядан табылган жок' де."
            user_prompt = f"Лекция:\n{context}\n\nСуроо: {question}\n\nЖооп:"

        else:
            system_prompt = "Ты ассистент по лекциям. Отвечай кратко, только на основе текста."
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
