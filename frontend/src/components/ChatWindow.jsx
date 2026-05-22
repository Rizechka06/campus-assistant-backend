import { useState, useRef, useEffect } from "react";
import Message from "./Message";
import { askQuestion } from "../api/api";

const TypingIndicator = () => (
  <div className="msg-row msg-row--bot">
    <div className="msg-avatar" aria-hidden="true">AI</div>
    <div className="typing-bubble">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </div>
  </div>
);

const getNow = () => {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const PLACEHOLDERS = {
  EN: "Ask about the lecture...",
  RU: "Задай вопрос по лекции...",
  KG: "Лекция боюнча суроо бер...",
};

const ChatWindow = ({ language, pdfUploaded }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      text: "Hi! Upload a lecture PDF and ask me anything about it 📚",
      time: getNow(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto resize textarea
  const handleInput = (e) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg = { id: Date.now(), role: "user", text, time: getNow() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setIsTyping(true);
    try {
      const res = await askQuestion(text, language);
      const botMsg = {
        id: Date.now() + 1,
        role: "bot",
        text: res.data.answer,
        time: getNow(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          text: "⚠️ Error connecting to server. Please try again.",
          time: getNow(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-window">
      {/* Messages area */}
      <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
        {!pdfUploaded && (
          <div className="chat-hint">Upload a PDF to start chatting</div>
        )}
        {messages.map((msg) => (
          <Message key={msg.id} role={msg.role} text={msg.text} time={msg.time} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="chat-input-bar">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          rows={1}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDERS[language] || PLACEHOLDERS.EN}
          disabled={!pdfUploaded}
          aria-label="Message input"
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={!input.trim() || isTyping || !pdfUploaded}
          aria-label="Send message"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;