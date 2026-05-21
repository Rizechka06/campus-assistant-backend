import { useState, useRef } from "react";
import { uploadPdf } from "../api/api";

const PdfUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      setErrorMsg("Only PDF files are allowed.");
      setStatus("error");
      return;
    }
    setFile(selected);
    setStatus("idle");
    setErrorMsg("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setProgress(0);
    setErrorMsg("");

    try {
      await uploadPdf(file, (pct) => setProgress(pct));
      setStatus("done");
      onUploadSuccess(file.name);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err?.response?.data?.detail || "Upload failed. Try again.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setProgress(0);
    setStatus("idle");
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="upload-card">
      {/* File picker area */}
      <div
        className={`drop-zone ${file ? "drop-zone--has-file" : ""}`}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Select PDF file"
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
          aria-hidden="true"
        />

        {file ? (
          <div className="file-info">
            <span className="file-icon" aria-hidden="true">📄</span>
            <span className="file-name">{file.name}</span>
            <span className="file-size">{(file.size / 1024).toFixed(0)} KB</span>
          </div>
        ) : (
          <div className="drop-hint">
            <span className="drop-icon" aria-hidden="true">📂</span>
            <span>Click to choose a PDF</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {status === "uploading" && (
        <div className="progress-wrap" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <span className="progress-label">{progress}%</span>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <p className="upload-error" role="alert">{errorMsg}</p>
      )}

      {/* Success */}
      {status === "done" && (
        <p className="upload-success">✅ Lecture uploaded successfully!</p>
      )}

      {/* Buttons */}
      <div className="upload-actions">
        {file && status !== "done" && (
          <button
            className="btn btn--primary"
            onClick={handleUpload}
            disabled={status === "uploading"}
          >
            {status === "uploading" ? "Uploading..." : "Upload"}
          </button>
        )}
        {(file || status === "done") && (
          <button className="btn btn--ghost" onClick={handleReset}>
            {status === "done" ? "Upload another" : "Clear"}
          </button>
        )}
      </div>
    </div>
  );
};

export default PdfUpload;
