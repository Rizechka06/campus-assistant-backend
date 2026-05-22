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
        """Возвращает структурированный конспект лекции в виде JSON"""
        if not self.is_loaded:
            return {
                "title": "Ошибка",
                "key_topics": [],
                "key_terms": [],
                "main_conclusions": ["Сначала загрузите PDF через load_pdf()"]
            }

        full_text = " ".join([chunk["text"] for chunk in self.chunks])
        full_text = full_text[:8000]
        full_text = full_text.encode('utf-8', errors='ignore').decode('utf-8')

        # Промпты на разных языках с требованием перевода
        if language == "ru":
            prompt = f"""Ты ассистент. Проанализируй лекцию и создай конспект НА РУССКОМ ЯЗЫКЕ.

Текст лекции (может быть на любом языке):
{full_text}

Верни ТОЛЬКО JSON в точном формате:
{{
    "title": "название лекции на русском",
    "key_topics": ["тема 1 на русском", "тема 2 на русском", "тема 3 на русском"],
    "key_terms": [
        {{"term": "термин на русском", "definition": "определение на русском"}},
        {{"term": "термин 2 на русском", "definition": "определение 2 на русском"}}
    ],
    "main_conclusions": ["вывод 1 на русском", "вывод 2 на русском", "вывод 3 на русском"]
}}

Только JSON, ничего другого."""

        elif language == "en":
            prompt = f"""You are an assistant. Analyze the lecture and create a summary IN ENGLISH.

IMPORTANT: The lecture text may be in Russian. You MUST output the summary in ENGLISH.
Translate all terms, definitions, and conclusions into ENGLISH.

Lecture text:
{full_text}

Return ONLY JSON in this exact format:
{{
    "title": "English title of the lecture",
    "key_topics": ["English topic 1", "English topic 2", "English topic 3"],
    "key_terms": [
        {{"term": "English term 1", "definition": "English definition 1"}},
        {{"term": "English term 2", "definition": "English definition 2"}}
    ],
    "main_conclusions": ["English conclusion 1", "English conclusion 2", "English conclusion 3"]
}}

Only JSON, nothing else."""

        elif language == "ky":
            prompt = f"""Сен жардамчысын. Лекцияны талдап, КЫРГЫЗ ТИЛИНДЕ конспект түзгүлө.

МААНИЛҮҮ: Лекциянын тексти орус тилинде болушу мүмкүн. Сен ЖООПТУ КЫРГЫЗ ТИЛИНДЕ беришиң керек.
Бардык терминдерди жана аныктамаларды КЫРГЫЗ ТИЛИНЕ которгула.

Лекциянын тексти:
{full_text}

ТЕК JSON форматында кайтаргыла:
{{
    "title": "лекциянын кыргызча аты",
    "key_topics": ["тема 1 кыргызча", "тема 2 кыргызча", "тема 3 кыргызча"],
    "key_terms": [
        {{"term": "кыргызча термин 1", "definition": "кыргызча аныктама 1"}},
        {{"term": "кыргызча термин 2", "definition": "кыргызча аныктама 2"}}
    ],
    "main_conclusions": ["кыргызча жыйынтык 1", "кыргызча жыйынтык 2", "кыргызча жыйынтык 3"]
}}

Тек JSON, башка эч нерсе."""

        else:
            prompt = f"""Ты ассистент. Проанализируй лекцию и создай конспект НА РУССКОМ ЯЗЫКЕ.

Текст лекции:
{full_text}

Верни ТОЛЬКО JSON в точном формате:
{{
    "title": "название лекции",
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

        question = question.encode('utf-8', errors='ignore').decode('utf-8')
        
        relevant_chunks = self._find_relevant_chunks(question)
        context = "\n\n---\n\n".join([chunk["text"] for chunk in relevant_chunks])
        context = context.encode('utf-8', errors='ignore').decode('utf-8')

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
