import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadPDF = async () => {
    if (!file) {
      alert('Выберите PDF файл');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadStatus('Загрузка...');
    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setUploadStatus(data.message || 'Загружено');
    } catch (error) {
      setUploadStatus('Ошибка: ' + error.message);
    }
  };

  const askQuestion = async () => {
    if (!question.trim()) {
      alert('Введите вопрос');
      return;
    }

    setLoading(true);
    setAnswer('');

    const formData = new FormData();
    formData.append('question', question);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setAnswer(data.answer || data.error || 'Нет ответа');
    } catch (error) {
      setAnswer('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Campus Lecture Assistant</h1>
      
      <h3>1. Загрузить PDF</h3>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      <button onClick={uploadPDF}>Загрузить</button>
      <p>{uploadStatus}</p>
      
      <h3>2. Задать вопрос</h3>
      <textarea 
        rows="3" 
        style={{ width: '100%' }}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Введите вопрос по лекции..."
      />
      <button onClick={askQuestion} disabled={loading}>
        {loading ? 'Думаю...' : 'Спросить'}
      </button>
      
      <h3>3. Ответ</h3>
      <div style={{ border: '1px solid #ccc', padding: '10px', background: '#f9f9f9' }}>
        {answer || 'Здесь появится ответ'}
      </div>
    </div>
  );
}

export default App;