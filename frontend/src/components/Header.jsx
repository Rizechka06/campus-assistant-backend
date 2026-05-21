const LANGUAGES = ["EN", "RU", "KG"];

const SUBTITLES = {
  EN: "Study smarter with AI",
  RU: "Учись умнее с ИИ",
  KG: "ИИ менен акылдуу оку",
};

const Header = ({ language, onLanguageChange }) => (
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
            className={`lang-pill ${language === lang ? "lang-pill--active" : ""}`}
            onClick={() => onLanguageChange(lang)}
            aria-pressed={language === lang}
          >
            {lang}
          </button>
        ))}
      </nav>
    </div>
  </header>
);

export default Header;
