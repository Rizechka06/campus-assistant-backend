const SUBTITLES = {
  EN: "AI-powered lecture summarizer",
  RU: "ИИ-конспект лекций",
};

const LANGUAGES = ["EN", "RU"];

const Header = ({ language, onLanguageChange, onLogout }) => (
  <header className="site-header">
    <div className="site-header__inner">
      <div className="site-header__brand">
        <span className="brand-icon" aria-hidden="true">📘</span>
        <div className="brand-text">
          <span className="brand-title">Lecture AI Assistant</span>
          <span className="brand-sub">{SUBTITLES[language]}</span>
        </div>
      </div>

      <nav className="lang-nav" aria-label="Language selector">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            className={`lang-pill${language === lang ? " lang-pill--active" : ""}`}
            onClick={() => onLanguageChange(lang)}
            aria-pressed={language === lang}
          >
            {lang}
          </button>
        ))}
      </nav>

      {/* Logout button */}
      {onLogout && (
        <button
          onClick={onLogout}
          className="btn btn--ghost btn--sm"
          style={{ marginLeft: 8 }}
        >
          🚪 {language === "RU" ? "Выйти" : "Log out"}
        </button>
      )}
    </div>
  </header>
);

export default Header;
