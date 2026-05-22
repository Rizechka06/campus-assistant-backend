import { useState } from "react";
import Header from "./components/Header";
import UploadCard from "./components/UploadCard";
import SummarySection from "./components/SummarySection";
import ChatWindow from "./components/ChatWindow";
import { generateSummary } from "./api/api";

const App = () => {
  const [language, setLanguage] = useState("EN");
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const handleUploadSuccess = (fileName) => {
    setPdfUploaded(true);
    setUploadedFileName(fileName);
    setSummary(null);
    setSummaryError("");
  };

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setSummaryError("");
    setSummary(null);
    try {
      const res = await generateSummary(language);
      console.log("Summary received:", res.data.summary);
      setSummary(res.data.summary);
    } catch (err) {
      console.error("Summary error:", err);
      setSummaryError("Failed to generate summary. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="app">
      <Header language={language} onLanguageChange={setLanguage} />
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