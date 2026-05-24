import { useState } from "react";
import Header from "./components/Header";
import UploadCard from "./components/UploadCard";
import SummarySection from "./components/SummarySection";
import ChatWindow from "./components/ChatWindow";
import AuthPage from "./components/AuthPage";
import { generateSummary } from "./api/api";

const ELEVENLABS_API_KEY = "YOUR_API_KEY_HERE"; // 🔑 Замени на свой ключ
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel — поддерживает русский через eleven_multilingual_v2

const App = () => {
  // Auth — stays logged in on refresh if token exists
  const [user, setUser] = useState(() =>
    localStorage.getItem("token") ? { token: localStorage.getItem("token") } : null
  );

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => { localStorage.removeItem("token"); setUser(null); };

  if (!user) return <AuthPage onLogin={handleLogin} />;

  const [language, setLanguage] = useState("EN");
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // TTS state
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState("");
  const [ttsAudio, setTtsAudio] = useState(null); // Audio instance
  const [ttsPlaying, setTtsPlaying] = useState(false);

  const handleUploadSuccess = (fileName) => {
    setPdfUploaded(true);
    setUploadedFileName(fileName);
    setSummary(null);
    setSummaryError("");
    stopAudio();
  };

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setSummaryError("");
    setSummary(null);
    stopAudio();
    try {
      const res = await generateSummary(language);
      setSummary(res.data.summary);
    } catch {
      setSummaryError("Failed to generate summary. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const stopAudio = () => {
    if (ttsAudio) {
      ttsAudio.pause();
      ttsAudio.currentTime = 0;
    }
    setTtsAudio(null);
    setTtsPlaying(false);
    setTtsError("");
  };

  // Build a plain text string from the summary object for TTS
  const buildSummaryText = (summary) => {
    if (!summary) return "";
    const parts = [];

    if (summary.title) parts.push(summary.title);
    if (summary.overview) parts.push(summary.overview);

    if (summary.topics?.length) {
      parts.push("Main topics: " + summary.topics.join(", "));
    }
    if (summary.terms?.length) {
      parts.push(
        "Key terms: " +
          summary.terms.map((t) => (typeof t === "string" ? t : t.term || t.label || "")).join(", ")
      );
    }
    if (summary.conclusions?.length) {
      parts.push("Conclusions:");
      summary.conclusions.forEach((c) => {
        parts.push(typeof c === "string" ? c : c.text || c.label || "");
      });
    }

    return parts.join(". ");
  };

  const handleSpeak = async () => {
    // If already playing — stop
    if (ttsPlaying) {
      stopAudio();
      return;
    }

    const text = buildSummaryText(summary);
    if (!text) return;

    setTtsLoading(true);
    setTtsError("");

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.detail?.message || "ElevenLabs API error");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        setTtsPlaying(false);
        setTtsAudio(null);
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setTtsError("Playback error.");
        setTtsPlaying(false);
        setTtsAudio(null);
      };

      setTtsAudio(audio);
      setTtsPlaying(true);
      audio.play();
    } catch (e) {
      setTtsError(e.message || "Failed to generate audio.");
    } finally {
      setTtsLoading(false);
    }
  };

  return (
    <div className="app">
      <Header language={language} onLanguageChange={setLanguage} onLogout={handleLogout} />
      <main className="main-container">
        <div className="page-wrapper">
          <div className="top-row">
            <UploadCard
              onUploadSuccess={handleUploadSuccess}
              pdfUploaded={pdfUploaded}
              uploadedFileName={uploadedFileName}
              language={language}
            />
            <SummarySection
              pdfUploaded={pdfUploaded}
              summary={summary}
              loading={summaryLoading}
              error={summaryError}
              onGenerate={handleGenerateSummary}
              language={language}
              // TTS props
              onSpeak={handleSpeak}
              ttsLoading={ttsLoading}
              ttsPlaying={ttsPlaying}
              ttsError={ttsError}
            />
          </div>
          <div className="chat-wrapper">
            <div className="chat-label">
              <span className="chat-label-dot" aria-hidden="true" />
              {pdfUploaded
                ? `AI Chat — ${uploadedFileName}`
                : "AI Chat — upload a PDF to start"}
            </div>
            <ChatWindow language={language} pdfUploaded={pdfUploaded} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
