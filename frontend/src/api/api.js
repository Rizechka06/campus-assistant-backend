const API_BASE = "http://localhost:8000";

const getToken = () => localStorage.getItem("token");

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

export const uploadPdf = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const token = getToken();
  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  return response.json();
};

export const askQuestion = async (question, language) => {
  const formData = new URLSearchParams();
  formData.append("question", question);
  formData.append("language", language.toLowerCase());
  
  const token = getToken();
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData.toString(),
  });
  const data = await response.json();
  return { data: { answer: data.answer } };
};

export const generateSummary = async (language) => {
  const data = await request("/summarize", {
    method: "POST",
    body: JSON.stringify({ language: language.toLowerCase() }),
  });
  return { data: { summary: data } };
};