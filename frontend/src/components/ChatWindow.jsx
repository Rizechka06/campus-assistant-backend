import Message from "./Message";

export default function ChatWindow() {
  const messages = [
    {
      role: "assistant",
      content: "Привет! Загрузите PDF лекцию.",
    },
  ];

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map((msg, index) => (
          <Message
            key={index}
            role={msg.role}
            content={msg.content}
          />
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          placeholder="Введите вопрос..."
        />

        <button>Send</button>
      </div>
    </div>
  );
}