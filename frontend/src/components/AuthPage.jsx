// src/components/AuthPage.jsx
import { useState } from "react";

const TEXTS = {
  EN: {
    tagline: "AI-powered lecture summarizer & chat",
    sub: "Upload your PDF lecture — get an instant summary and ask questions.",
    login: "Sign In", register: "Register",
    email: "Email", password: "Password",
    emailPh: "you@example.com", passPh: "••••••••",
    submit_login: "Sign In", submit_register: "Create Account", wait: "Please wait…",
    switch_to_register: "Don't have an account?", switch_to_login: "Already have an account?",
    switch_link_register: "Register", switch_link_login: "Sign In",
    error_fields: "Please fill in all fields.", error_network: "Network error. Please try again.",
    back: "← Back",
  },
  RU: {
    tagline: "ИИ-конспект лекций и чат",
    sub: "Загрузите PDF лекцию — получите краткое содержание и задавайте вопросы.",
    login: "Войти", register: "Регистрация",
    email: "Email", password: "Пароль",
    emailPh: "you@example.com", passPh: "••••••••",
    submit_login: "Войти", submit_register: "Создать аккаунт", wait: "Подождите…",
    switch_to_register: "Нет аккаунта?", switch_to_login: "Уже есть аккаунт?",
    switch_link_register: "Зарегистрироваться", switch_link_login: "Войти",
    error_fields: "Пожалуйста, заполните все поля.", error_network: "Ошибка сети. Попробуйте снова.",
    back: "← Назад",
  },
  KG: {
    tagline: "AI менен лекция конспекти жана чат",
    sub: "PDF лекцияңызды жүктөңүз — кыскача мазмун алыңыз жана суроолор бериңиз.",
    login: "Кирүү", register: "Катталуу",
    email: "Email", password: "Сырсөз",
    emailPh: "you@example.com", passPh: "••••••••",
    submit_login: "Кирүү", submit_register: "Аккаунт түзүү", wait: "Күтүңүз…",
    switch_to_register: "Аккаунтуңуз жокпу?", switch_to_login: "Аккаунтуңуз барбы?",
    switch_link_register: "Катталуу", switch_link_login: "Кирүү",
    error_fields: "Бардык талааларды толтуруңуз.", error_network: "Тармак катасы. Кайра аракет кылыңыз.",
    back: "← Артка",
  },
};

const OwlLogo = ({ size = 90 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" stroke="#1B3A6B" strokeWidth="3.5" fill="white" />
    <path d="M22 65 Q50 58 78 65 L78 78 Q50 71 22 78 Z" fill="#1B3A6B" />
    <path d="M50 60 L50 79" stroke="#1B3A6B" strokeWidth="2" />
    <path d="M22 65 Q22 55 28 52" stroke="#1B3A6B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M78 65 Q78 55 72 52" stroke="#1B3A6B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M28 52 Q50 45 72 52" stroke="#1B3A6B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <ellipse cx="50" cy="43" rx="16" ry="18" fill="#1B3A6B" />
    <ellipse cx="50" cy="44" rx="13" ry="14" fill="white" />
    <circle cx="44" cy="42" r="5" fill="#1B3A6B" />
    <circle cx="56" cy="42" r="5" fill="#1B3A6B" />
    <circle cx="44" cy="42" r="3" fill="white" />
    <circle cx="56" cy="42" r="3" fill="white" />
    <circle cx="44" cy="43" r="1.5" fill="#1B3A6B" />
    <circle cx="56" cy="43" r="1.5" fill="#1B3A6B" />
    <path d="M48 47 L50 50 L52 47 Z" fill="#F59E0B" />
    <path d="M34 40 Q34 26 50 26 Q66 26 66 40" stroke="#4F8EF7" strokeWidth="3" fill="none" strokeLinecap="round" />
    <rect x="30" y="38" width="7" height="10" rx="3" fill="#4F8EF7" />
    <rect x="63" y="38" width="7" height="10" rx="3" fill="#4F8EF7" />
    <path d="M44 21 Q50 17 56 21" stroke="#4F8EF7" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M41 17 Q50 11 59 17" stroke="#4F8EF7" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M38 13 Q50 5 62 13" stroke="#4F8EF7" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

const LANGS = ["EN", "RU", "KG"];

const AuthPage = ({ onLogin }) => {
  const [lang, setLang] = useState("EN");
  const [screen, setScreen] = useState("landing");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = TEXTS[lang];

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) { setError(t.error_fields); return; }
    setLoading(true);
    try {
      const endpoint = screen === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || data.detail || "Error"); return; }
      if (data.token) localStorage.setItem("token", data.token);
      onLogin(data.user || { email: form.email });
    } catch {
      setError(t.error_network);
    } finally {
      setLoading(false);
    }
  };

  const LangSwitcher = () => (
    <div style={s.langRow}>
      {LANGS.map((l) => (
        <button key={l} onClick={() => setLang(l)}
          style={{ ...s.langBtn, ...(lang === l ? s.langBtnActive : {}) }}>
          {l}
        </button>
      ))}
    </div>
  );

  if (screen === "landing") return (
    <div style={s.page}>
      <div style={s.topBar}>
        <div style={s.brand}><OwlLogo size={36} /><span style={s.brandName}>Lecture AI</span></div>
        <LangSwitcher />
        <div style={s.topBtns}>
          <button style={s.btnOutline} onClick={() => { setScreen("login"); setError(""); }}>{t.login}</button>
          <button style={s.btnSolid} onClick={() => { setScreen("register"); setError(""); }}>{t.register}</button>
        </div>
      </div>
      <div style={s.hero}>
        <OwlLogo size={120} />
        <h1 style={s.heroTitle}>Lecture AI Assistant</h1>
        <p style={s.heroSub}>{t.tagline}</p>
        <p style={s.heroDesc}>{t.sub}</p>
        <div style={s.heroBtns}>
          <button style={s.heroLogin} onClick={() => { setScreen("login"); setError(""); }}>{t.login}</button>
          <button style={s.heroRegister} onClick={() => { setScreen("register"); setError(""); }}>{t.register}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <div style={s.brand}><OwlLogo size={36} /><span style={s.brandName}>Lecture AI</span></div>
        <LangSwitcher />
      </div>
      <div style={s.formWrap}>
        <div style={s.formCard}>
          <button style={s.back} onClick={() => { setScreen("landing"); setError(""); }}>{t.back}</button>
          <OwlLogo size={68} />
          <h2 style={s.formTitle}>{screen === "login" ? t.login : t.register}</h2>
          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>{t.email}</label>
              <input style={s.input} type="email" name="email"
                placeholder={t.emailPh} value={form.email} onChange={handleChange} autoComplete="email" />
            </div>
            <div style={s.field}>
              <label style={s.label}>{t.password}</label>
              <input style={s.input} type="password" name="password"
                placeholder={t.passPh} value={form.password} onChange={handleChange}
                autoComplete={screen === "login" ? "current-password" : "new-password"} />
            </div>
            {error && <div style={s.error}>⚠️ {error}</div>}
            <button style={s.submitBtn} type="submit" disabled={loading}>
              {loading ? t.wait : screen === "login" ? t.submit_login : t.submit_register}
            </button>
          </form>
          <p style={s.switchText}>
            {screen === "login" ? t.switch_to_register : t.switch_to_login}{" "}
            <span style={s.switchLink}
              onClick={() => { setScreen(screen === "login" ? "register" : "login"); setError(""); }}>
              {screen === "login" ? t.switch_link_register : t.switch_link_login}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#EBF3FF 0%,#F4F6FB 60%,#E8F4FD 100%)", display: "flex", flexDirection: "column", fontFamily: "'Segoe UI',-apple-system,sans-serif" },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 32px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", borderBottom: "1px solid #E5E9F0", flexWrap: "wrap", gap: 10 },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  brandName: { fontSize: 18, fontWeight: 700, color: "#1B3A6B", letterSpacing: "-0.3px" },
  langRow: { display: "flex", gap: 4 },
  langBtn: { padding: "5px 13px", borderRadius: 999, border: "1px solid #D0D7E3", background: "transparent", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: "pointer" },
  langBtnActive: { background: "#4F8EF7", borderColor: "#4F8EF7", color: "#fff" },
  topBtns: { display: "flex", gap: 8 },
  btnOutline: { padding: "8px 22px", borderRadius: 10, border: "1.5px solid #4F8EF7", background: "transparent", color: "#4F8EF7", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  btnSolid: { padding: "8px 22px", borderRadius: 10, border: "none", background: "#4F8EF7", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  hero: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "60px 20px", textAlign: "center" },
  heroTitle: { fontSize: 38, fontWeight: 800, color: "#1B3A6B", margin: 0, letterSpacing: "-0.5px" },
  heroSub: { fontSize: 18, fontWeight: 600, color: "#4F8EF7", margin: 0 },
  heroDesc: { fontSize: 15, color: "#6B7280", maxWidth: 480, margin: 0, lineHeight: 1.6 },
  heroBtns: { display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap", justifyContent: "center" },
  heroLogin: { padding: "13px 44px", borderRadius: 12, border: "2px solid #1B3A6B", background: "transparent", color: "#1B3A6B", fontWeight: 700, fontSize: 16, cursor: "pointer" },
  heroRegister: { padding: "13px 44px", borderRadius: 12, border: "none", background: "#4F8EF7", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 16px rgba(79,142,247,0.35)" },
  formWrap: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  formCard: { background: "#fff", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.09)", padding: "32px 32px", width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  back: { alignSelf: "flex-start", background: "none", border: "none", color: "#6B7280", fontSize: 13, cursor: "pointer", marginBottom: 4, padding: 0 },
  formTitle: { fontSize: 22, fontWeight: 700, color: "#1B3A6B", margin: "10px 0 18px" },
  form: { width: "100%", display: "flex", flexDirection: "column", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: { padding: "10px 14px", borderRadius: 10, border: "1px solid #E5E9F0", fontSize: 14, color: "#111827", outline: "none", background: "#F8F9FC", fontFamily: "inherit" },
  error: { fontSize: 13, color: "#EF4444", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px" },
  submitBtn: { marginTop: 4, padding: "11px 0", borderRadius: 10, background: "#4F8EF7", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(79,142,247,0.3)" },
  switchText: { fontSize: 13, color: "#6B7280", marginTop: 16, textAlign: "center" },
  switchLink: { color: "#4F8EF7", cursor: "pointer", fontWeight: 600 },
};

export default AuthPage;
