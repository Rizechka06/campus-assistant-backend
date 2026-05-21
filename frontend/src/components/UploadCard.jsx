import { useState, useRef } from "react";
import { uploadPdf } from "../api/api";

const LABELS = {
  EN: { title: "Upload Lecture", choose: "Choose PDF file", upload: "Upload", uploading: "Uploading...", another: "Change file", hint: "PDF up to 50 MB" },
  RU: { title: "Загрузить лекцию", choose: "Выбрать PDF файл", upload: "Загрузить", uploading: "Загрузка...", another: "Изменить файл", hint: "PDF до 50 МБ" },
  KG: { title: "Лекция жүктөө", choose: "PDF файл тандоо", upload: "Жүктөө", uploading: "Жүктөлүүдө...", another: "Файлды өзгөртүү", hint: "PDF 50 МБга чейин" },
};

const UploadCard = ({ onUploadSuccess, pdfUploaded, uploadedFileName, language }) => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);
  const t = LABELS[language] || LABELS.EN;

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      setErrorMsg("Only PDF files are supported.");
      setStatus("error");
      return;
    }
    setFile(f);
    setStatus("idle");
    setErrorMsg("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setProgress(0);
    try {
      await uploadPdf(file, setProgress);
      setStatus("done");
      onUploadSuccess(file.name);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err?.response?.data?.detail || "Upload failed.");
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
    <div className="card upload-card">
      <div className="card__header">
        <span className="card__icon" aria-hidden="true">📂</span>
        <h2 className="card__title">{t.title}</h2>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        style={{ display: "none" }}
        id="pdf-input"
        aria-label="Select PDF file"
      />

      <label htmlFor="pdf-input" className={`drop-zone ${file ? "drop-zone--filled" : ""}`}>
        {file ? (
          <div className="file-chip">
            <span className="file-chip__icon" aria-hidden="true">📄</span>
            <div className="file-chip__info">
              <span className="file-chip__name">{file.name}</span>
              <span className="file-chip__size">{(file.size / 1024).toFixed(0)} KB</span>
            </div>
          </div>
        ) : (
          <div className="drop-zone__hint">
            <span className="drop-zone__arrow" aria-hidden="true">⬆</span>
            <span>{t.choose}</span>
            <span className="drop-zone__sub">{t.hint}</span>
          </div>
        )}
      </label>

      {status === "uploading" && (
        <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <span className="progress-pct">{progress}%</span>
        </div>
      )}

      {status === "error" && <p className="msg msg--error" role="alert">{errorMsg}</p>}
      {status === "done" && <p className="msg msg--success">✅ Uploaded successfully!</p>}

      <div className="upload-card__actions">
        {file && status !== "done" && (
          <button className="btn btn--primary" onClick={handleUpload} disabled={status === "uploading"}>
            {status === "uploading" ? t.uploading : t.upload}
          </button>
        )}
        {file && (
          <button className="btn btn--ghost" onClick={handleReset}>
            {status === "done" ? t.another : "Clear"}
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadCard;
