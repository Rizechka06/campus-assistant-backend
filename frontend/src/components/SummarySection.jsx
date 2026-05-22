const SummarySection = ({ pdfUploaded, summary, loading, error, onGenerate, language }) => {
  const getButtonText = () => {
    if (loading) return "⏳ Generating...";
    return "📝 Generate Summary";
  };

  if (!pdfUploaded) {
    return (
      <div className="summary-section">
        <div className="summary-placeholder">
          📄 Upload a PDF to generate summary
        </div>
      </div>
    );
  }

  return (
    <div className="summary-section">
      <button className="summary-btn" onClick={onGenerate} disabled={loading}>
        {getButtonText()}
      </button>
      
      {error && <div className="summary-error">{error}</div>}
      
      {summary && (
        <div className="summary-content">
          <h4>📋 Lecture Summary</h4>
          
          {summary.title && (
            <p><strong>Title:</strong> {summary.title}</p>
          )}
          
          {summary.key_topics && summary.key_topics.length > 0 && (
            <div className="summary-block">
              <strong>🔑 Key Topics:</strong>
              <ul>
                {summary.key_topics.map((topic, i) => (
                  <li key={i}>{topic}</li>
                ))}
              </ul>
            </div>
          )}
          
          {summary.key_terms && summary.key_terms.length > 0 && (
            <div className="summary-block">
              <strong>📖 Key Terms:</strong>
              <ul>
                {summary.key_terms.map((term, i) => (
                  <li key={i}>
                    <strong>{term.term}</strong> — {term.definition}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {summary.main_conclusions && summary.main_conclusions.length > 0 && (
            <div className="summary-block">
              <strong>💡 Main Conclusions:</strong>
              <ul>
                {summary.main_conclusions.map((conc, i) => (
                  <li key={i}>{conc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SummarySection;