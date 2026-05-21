import os
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

MODEL_NAME = "openrouter/free"


class LectureAssistant:
    def __init__(self):
        self.chunks = []
        self.is_loaded = False
        print("🤖 Ассистент готов к работе (OpenRouter)")

    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        try:
            reader = PdfReader(pdf_path)
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
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
        print(f"✅ Лекция загружена! {len(self.chunks)} фрагментов")
        return True

    def _find_relevant_chunks(self, query: str, top_k: int = 5) -> list:
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

    def ask(self, question: str, language: str = "ru") -> str:
        if not self.is_loaded:
            return "❌ Сначала загрузите лекцию"

        relevant_chunks = self._find_relevant_chunks(question)
        context = "\n\n---\n\n".join([chunk["text"] for chunk in relevant_chunks])

        system_prompts = {
            "ru": "Ты ассистент по учебным лекциям. Отвечай на вопросы, используя ТОЛЬКО текст лекции. Если ответа нет — скажи: 'В лекции это не найдено'. Отвечай кратко (1-3 предложения).",
            "en": "You are a lecture assistant. Answer questions using ONLY the lecture text. If not found, say: 'Not found in the lecture'. Answer briefly (1-3 sentences).",
            "ky": "Сен лекция боюнча жардамчысың. Суроолорго ТЕК лекция текстин колдонуп жооп бер. Жооп жок болсо: 'Лекциядан табылган жок' деп айт. Кыскача жооп бер (1-3 сүйлөм)."
        }

        user_prompts = {
            "ru": f"""Фрагменты лекции:
{context}

Вопрос: {question}

Ответ:""",
            "en": f"""Lecture fragments:
{context}

Question: {question}

Answer:""",
            "ky": f"""Лекциянын фрагменттери:
{context}

Суроо: {question}

Жооп:"""
        }

        try:
            completion = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompts.get(language, system_prompts["ru"])},
                    {"role": "user", "content": user_prompts.get(language, user_prompts["ru"])}
                ],
                temperature=0.3,
                extra_headers={
                    "HTTP-Referer": "http://localhost",
                    "X-Title": "Campus Lecture Assistant",
                }
            )
            return completion.choices[0].message.content
        except Exception as e:
            return f"❌ Ошибка: {str(e)}"

    def generate_summary(self, language: str = "ru") -> dict:
        if not self.is_loaded or not self.chunks:
            return {"error": "Сначала загрузите PDF"}

        full_text = " ".join([chunk["text"] for chunk in self.chunks[:15]])

        prompts = {
            "ru": {
                "system": "Ты ассистент, который составляет структурированные конспекты лекций.",
                "user": f"""На основе текста лекции составь краткий конспект в формате:

## 📚 КЛЮЧЕВЫЕ ТЕМЫ
(3-5 основных тем лекции)

## 📖 ВАЖНЫЕ ТЕРМИНЫ
(список терминов с краткими определениями)

## 💡 ОСНОВНЫЕ ВЫВОДЫ
(3-5 главных тезисов)

Текст лекции:
{full_text[:8000]}
"""
            },
            "en": {
                "system": "You are an assistant that creates structured lecture summaries.",
                "user": f"""Based on the lecture text, create a brief summary in the format:

## 📚 KEY TOPICS
(3-5 main topics)

## 📖 IMPORTANT TERMS
(list of terms with brief definitions)

## 💡 MAIN CONCLUSIONS
(3-5 key takeaways)

Lecture text:
{full_text[:8000]}
"""
            },
            "ky": {
                "system": "Сен лекциялардын түзүмдүк конспектин түзүүчү жардамчысың.",
                "user": f"""Лекция текстинин негизинде кыскача конспект түзүү:

## 📚 НЕГИЗГИ ТЕМАЛАР
(3-5 негизги тема)

## 📖 МААНИЛҮҮ ТЕРМИНДЕР
(терминдердин тизмеси жана кыскача түшүндүрмөсү)

## 💡 НЕГИЗГИ ЖЫЙЫНТЫКТАР
(3-5 негизги жыйынтык)

Лекция тексти:
{full_text[:8000]}
"""
            }
        }

        p = prompts.get(language, prompts["ru"])

        try:
            completion = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": p["system"]},
                    {"role": "user", "content": p["user"]}
                ],
                temperature=0.3,
                extra_headers={
                    "HTTP-Referer": "http://localhost",
                    "X-Title": "Campus Lecture Assistant",
                }
            )
            return {"summary": completion.choices[0].message.content, "language": language}
        except Exception as e:
            return {"error": f"Ошибка генерации конспекта: {str(e)}"}


def main():
    assistant = LectureAssistant()
    try:
        test_response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": "Ответь 'OK'"}],
            extra_headers={"HTTP-Referer": "http://localhost", "X-Title": "Campus Lecture Assistant"}
        )
        print(f"✅ OpenRouter работает! Ответ: {test_response.choices[0].message.content}")
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")


if __name__ == "__main__":
    main()