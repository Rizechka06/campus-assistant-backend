import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Upload PDF
export const uploadPdf = (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress) {
        const percent = Math.round((e.loaded * 100) / e.total);
        onProgress(percent);
      }
    },
  });
};

// Ask question
export const askQuestion = (question, language) =>
  api.post("/chat", { question, language });

// Generate summary
export const generateSummary = (language) =>
  api.post("/summarize", { language });
