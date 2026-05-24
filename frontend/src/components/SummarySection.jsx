import { useState } from "react";

const SummarySection = ({ pdfUploaded, summary, loading, error, onGenerate }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const formatSummaryToText = (summaryData) => {
    if (!summaryData) return "";
    let text = "";
    if (summaryData.title) text += `Название лекции: ${summaryData.title}. `;
    if (summaryData.key_topics?.length) {
      text += `Ключевые темы: ${summaryData.key_topics.join(", ")}. `;
    }
    if (summaryData.key_terms?.length) {
      text += `Термины: `;
      summaryData.key_terms.forEach((term) => {
        text += `${term.term} — ${term.definition}. `;
      });
    }
    if (summaryData.main_conclusions?.length) {
      text += `Выводы: ${summaryData.main_conclusions.join(", ")}. `;
    }
    return text;
  };

  const speakSummary = () => {
    if (!summary) {
      alert("Сначала сгенерируйте конспект");
      return;
    }

    const textToSpeak = formatSummaryToText(summary);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "ru-RU";
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  if (!pdfUploaded) {
    return (
      <div style={{ padding: 16, background: "#f0f0f0", borderRadius: 12 }}>
        📄 Upload a PDF to generate summary
      </div>
    );
  }

  return (
    <div style={{ padding: 16, background: "#f9f9f9", borderRadius: 12 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button
          onClick={onGenerate}
          disabled={loading}
          style={{
            padding: "10px 20px",
            background: "#4F8EF7",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {loading ? "⏳ Generating..." : "📝 Generate Summary"}
        </button>

        {summary && (
          <>
            <button
              onClick={speakSummary}
              disabled={isSpeaking}
              style={{
                padding: "10px 20px",
                background: "#28a745",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              {isSpeaking ? "🔊 Speaking..." : "🔊 Listen"}
            </button>
            <button
              onClick={stopSpeaking}
              style={{
                padding: "10px 20px",
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              ⏹ Stop
            </button>
          </>
        )}
      </div>

      {error && <div style={{ color: "red", marginTop: 8 }}>❌ {error}</div>}

      {summary && (
        <div
          style={{
            marginTop: 16,
            background: "white",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        >
          <h4 style={{ margin: "0 0 8px 0" }}>📋 Lecture Summary</h4>
          <div>
            <strong>Title:</strong> {summary.title}
          </div>
          <div>
            <strong>Key Topics:</strong> {summary.key_topics?.join(", ")}
          </div>
          <div>
            <strong>Key Terms:</strong>
          </div>
          <ul>
            {summary.key_terms?.map((term, i) => (
              <li key={i}>
                <strong>{term.term}</strong> — {term.definition}
              </li>
            ))}
          </ul>
          <div>
            <strong>Main Conclusions:</strong>
          </div>
          <ul>
            {summary.main_conclusions?.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SummarySection;