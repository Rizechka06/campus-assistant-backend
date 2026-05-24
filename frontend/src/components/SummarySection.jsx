// components/SummarySection.jsx
// Добавлена кнопка 🔊 Озвучить через ElevenLabs

const SummarySection = ({
  pdfUploaded,
  summary,
  loading,
  error,
  onGenerate,
  language,
  // TTS
  onSpeak,
  ttsLoading,
  ttsPlaying,
  ttsError,
}) => {
  const t = {
    EN: {
      title: "Summary",
      generate: "Generate Summary",
      generating: "Generating…",
      locked: "Upload a PDF to generate a summary",
      idle: "Click 'Generate Summary' to analyse the document.",
      speak: "Read aloud",
      stop: "Stop",
      speaking: "Loading audio…",
    },
    RU: {
      title: "Конспект",
      generate: "Создать конспект",
      generating: "Создаём…",
      locked: "Загрузите PDF, чтобы создать конспект",
      idle: "Нажмите «Создать конспект» для анализа документа.",
      speak: "Озвучить",
      stop: "Стоп",
      speaking: "Загрузка аудио…",
    },
  }[language] || {};

  return (
    <div className={`card summary-card${!pdfUploaded ? " card--locked" : ""}`}>
      {/* Header */}
      <div className="card__header">
        <span className="card__icon">📋</span>
        <span className="card__title">{t.title}</span>

        {/* Action buttons row */}
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Speak button — always visible, disabled until summary is ready */}
          <button
            className="btn btn--sm btn--ghost"
            onClick={onSpeak}
            disabled={!summary || !pdfUploaded || ttsLoading}
            title={ttsPlaying ? t.stop : t.speak}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              borderColor: ttsPlaying ? "var(--blue)" : undefined,
              color: ttsPlaying ? "var(--blue)" : undefined,
            }}
          >
            {ttsLoading ? (
              <>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    border: "2px solid var(--border-strong)",
                    borderTopColor: "var(--blue)",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                {t.speaking}
              </>
            ) : ttsPlaying ? (
              <>⏹ {t.stop}</>
            ) : (
              <>🔊 {t.speak}</>
            )}
          </button>

          {/* Generate button */}
          <button
            className="btn btn--primary btn--sm"
            onClick={onGenerate}
            disabled={!pdfUploaded || loading}
          >
            {loading ? t.generating : t.generate}
          </button>
        </div>
      </div>

      {/* TTS error */}
      {ttsError && (
        <div className="msg msg--error" style={{ marginBottom: 12 }}>
          ⚠️ {ttsError}
        </div>
      )}

      {/* Body */}
      {!pdfUploaded ? (
        <div className="summary-locked">
          <span className="summary-locked__icon">🔒</span>
          <span>{t.locked}</span>
        </div>
      ) : loading ? (
        <div className="summary-loading">
          <span className="skeleton" />
          <span className="skeleton skeleton--medium" />
          <span className="skeleton skeleton--short" />
          <span className="skeleton" />
          <span className="skeleton skeleton--medium" />
        </div>
      ) : error ? (
        <div className="msg msg--error">{error}</div>
      ) : !summary ? (
        <p className="summary-idle">{t.idle}</p>
      ) : (
        <div className="summary-body">
          {/* Overview */}
          {summary.overview && (
            <div className="sum-block">
              <div className="sum-block__label">Overview</div>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
                {summary.overview}
              </p>
            </div>
          )}

          {/* Topics */}
          {summary.topics?.length > 0 && (
            <div className="sum-block">
              <div className="sum-block__label">Topics</div>
              <div className="sum-block__items--pills">
                {summary.topics.map((topic, i) => (
                  <span key={i} className="sum-pill sum-pill--accent">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Terms */}
          {summary.terms?.length > 0 && (
            <div className="sum-block">
              <div className="sum-block__label">Key Terms</div>
              <div className="sum-block__items--pills">
                {summary.terms.map((term, i) => (
                  <span key={i} className="sum-pill">
                    {typeof term === "string" ? term : term.term || term.label || term}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Conclusions */}
          {summary.conclusions?.length > 0 && (
            <div className="sum-block">
              <div className="sum-block__label">Conclusions</div>
              <div className="sum-block__items--list">
                {summary.conclusions.map((item, i) => (
                  <div key={i} className="sum-list-item">
                    <span className="sum-list-item__dot" />
                    <span>{typeof item === "string" ? item : item.text || item.label || item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spinner keyframe — injected inline so no extra CSS file needed */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SummarySection;
