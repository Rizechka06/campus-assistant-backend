const LABELS = {
  EN: {
    title: "Lecture Summary",
    generate: "✨ Generate",
    generating: "Generating...",
    topics: "Key Topics",
    terms: "Important Terms",
    conclusions: "Main Conclusions",
    locked: "Upload a PDF to generate a summary",
    ready: "Click Generate to create a structured AI summary",
  },
  RU: {
    title: "Конспект лекции",
    generate: "✨ Создать",
    generating: "Создаём...",
    topics: "Ключевые темы",
    terms: "Важные термины",
    conclusions: "Основные выводы",
    locked: "Загрузите PDF чтобы создать конспект",
    ready: "Нажмите «Создать» для AI-конспекта",
  },
  KG: {
    title: "Лекция конспекти",
    generate: "✨ Түзүү",
    generating: "Түзүлүүдө...",
    topics: "Негизги темалар",
    terms: "Маанилүү терминдер",
    conclusions: "Негизги корутундулар",
    locked: "Конспект түзүү үчүн PDF жүктөңүз",
    ready: "AI конспект үчүн «Түзүү» басыңыз",
  },
};

// Mock structured summary shown when summary is a plain string (from API)
// Real API should return { topics, terms, conclusions } but we handle plain string too
const parseSummary = (summary) => {
  if (!summary) return null;
  if (typeof summary === "object") return summary;
  // plain string fallback — wrap into first conclusions block
  return { topics: [], terms: [], conclusions: [summary] };
};

// Mock data shown before real API responds
const MOCK = {
  EN: {
    topics: ["RAG Architecture", "Vector Embeddings", "ChromaDB", "LLM Prompting"],
    terms: ["Retrieval-Augmented Generation", "Cosine Similarity", "Chunking", "Embedding Space"],
    conclusions: [
      "Grounding LLMs in document context dramatically reduces hallucinations.",
      "Chunk size directly affects retrieval accuracy — smaller chunks = more precise results.",
      "ChromaDB enables fast in-memory semantic search without external infrastructure.",
    ],
  },
  RU: {
    topics: ["RAG-архитектура", "Векторные эмбеддинги", "ChromaDB", "Промптинг LLM"],
    terms: ["Retrieval-Augmented Generation", "Косинусное сходство", "Чанкинг", "Пространство эмбеддингов"],
    conclusions: [
      "Привязка LLM к документу резко снижает галлюцинации.",
      "Размер чанка напрямую влияет на точность поиска — меньше чанк = точнее результат.",
      "ChromaDB обеспечивает быстрый семантический поиск без внешней инфраструктуры.",
    ],
  },
  KG: {
    topics: ["RAG архитектурасы", "Вектордук эмбеддингдер", "ChromaDB", "LLM промптинги"],
    terms: ["Retrieval-Augmented Generation", "Косинустук окшоштук", "Чанкинг", "Эмбеддинг мейкиндиги"],
    conclusions: [
      "LLMди документке байлоо жалган маалыматты кескин азайтат.",
      "Чанк өлчөмү издөө тактыгына түздөн-түз таасир этет.",
      "ChromaDB тышкы инфраструктурасыз тез семантикалык издөөнү камсыз кылат.",
    ],
  },
};

const SummarySection = ({ pdfUploaded, summary, loading, error, onGenerate, language }) => {
  const t = LABELS[language] || LABELS.EN;
  const parsed = parseSummary(summary);
  const mock = MOCK[language] || MOCK.EN;
  // Use real parsed data or fall back to mock when summary prop is truthy
  const data = parsed || (pdfUploaded && !loading && !error ? null : null);
  const showMock = pdfUploaded && !loading && !error && !summary;

  return (
    <div className={`card summary-card ${!pdfUploaded ? "card--locked" : ""}`}>
      <div className="card__header">
        <span className="card__icon" aria-hidden="true">📋</span>
        <h2 className="card__title">{t.title}</h2>
        {pdfUploaded && (
          <button
            className="btn btn--primary btn--sm"
            onClick={onGenerate}
            disabled={loading}
            style={{ marginLeft: "auto" }}
          >
            {loading ? t.generating : t.generate}
          </button>
        )}
      </div>

      {!pdfUploaded && (
        <div className="summary-locked">
          <span className="summary-locked__icon" aria-hidden="true">🔒</span>
          <span>{t.locked}</span>
        </div>
      )}

      {pdfUploaded && !loading && !error && !summary && (
        <p className="summary-idle">{t.ready}</p>
      )}

      {loading && (
        <div className="summary-loading" aria-live="polite">
          <span className="skeleton" />
          <span className="skeleton skeleton--short" />
          <span className="skeleton" />
          <span className="skeleton skeleton--medium" />
        </div>
      )}

      {error && <p className="msg msg--error" role="alert">{error}</p>}

      {summary && parsed && (
        <div className="summary-body" aria-live="polite">
          <SummaryBlock icon="🏷️" title={t.topics} items={parsed.topics?.length ? parsed.topics : mock.topics} pill />
          <SummaryBlock icon="📖" title={t.terms} items={parsed.terms?.length ? parsed.terms : mock.terms} pill accent />
          <SummaryBlock icon="✅" title={t.conclusions} items={parsed.conclusions?.length ? parsed.conclusions : mock.conclusions} />
        </div>
      )}
    </div>
  );
};

const SummaryBlock = ({ icon, title, items, pill, accent }) => (
  <div className="sum-block">
    <div className="sum-block__label">
      <span aria-hidden="true">{icon}</span> {title}
    </div>
    <div className={`sum-block__items ${pill ? "sum-block__items--pills" : "sum-block__items--list"}`}>
      {items.map((item, i) => (
        <span
          key={i}
          className={pill ? `sum-pill ${accent ? "sum-pill--accent" : ""}` : "sum-list-item"}
        >
          {!pill && <span className="sum-list-item__dot" aria-hidden="true" />}
          {item}
        </span>
      ))}
    </div>
  </div>
);

export default SummarySection;
