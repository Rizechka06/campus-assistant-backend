// src/components/AuthPage.jsx
import { useState } from "react";

const AuthPage = ({ onLogin }) => {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }


    setLoading(true);
    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";

      const body =
        mode === "login"
          ? { email: form.email, password: form.password }
          : { email: form.email, password: form.password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.detail || "Something went wrong.");
        return;
      }

      // Save token and call onLogin
      if (data.token) localStorage.setItem("token", data.token);
      onLogin(data.user || { email: form.email });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>🎓</div>
        <h1 style={styles.title}>Campus Assistant</h1>
        <p style={styles.sub}>AI-powered PDF summarizer & chat</p>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(mode === "login" ? styles.tabActive : {}) }}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Sign In
          </button>
          <button
            style={{ ...styles.tab, ...(mode === "register" ? styles.tabActive : {}) }}
            onClick={() => { setMode("register"); setError(""); }}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && <div style={styles.error}>⚠️ {error}</div>}

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading
              ? "Please wait…"
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <p style={styles.switch}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <span
            style={styles.link}
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
          >
            {mode === "login" ? "Register" : "Sign In"}
          </span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    minHeight: "100vh",
    background: "#F4F6FB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    boxShadow: "0 4px 24px rgba(0,0,0,0.09)",
    padding: "40px 36px",
    width: "100%",
    maxWidth: 400,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
  },
  logo: { fontSize: 42, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 },
  sub: { fontSize: 13, color: "#6B7280", margin: "6px 0 24px" },
  tabs: {
    display: "flex",
    background: "#F4F6FB",
    borderRadius: 10,
    padding: 4,
    gap: 4,
    width: "100%",
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    padding: "8px 0",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "#6B7280",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  tabActive: {
    background: "#fff",
    color: "#4F8EF7",
    boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
  },
  form: { width: "100%", display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },
  input: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #E5E9F0",
    fontSize: 14,
    color: "#111827",
    outline: "none",
    background: "#F8F9FC",
    transition: "border-color 0.15s",
    fontFamily: "inherit",
  },
  error: {
    fontSize: 13,
    color: "#EF4444",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: 8,
    padding: "8px 12px",
  },
  btn: {
    marginTop: 4,
    padding: "11px 0",
    borderRadius: 10,
    background: "#4F8EF7",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    border: "none",
    cursor: "pointer",
    transition: "background 0.15s",
    fontFamily: "inherit",
  },
  switch: { fontSize: 13, color: "#6B7280", marginTop: 20 },
  link: { color: "#4F8EF7", cursor: "pointer", fontWeight: 600 },
};

export default AuthPage;
