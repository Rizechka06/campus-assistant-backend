const Message = ({ role, text, time }) => {
  const isUser = role === "user";

  return (
    <div className={`msg-row ${isUser ? "msg-row--user" : "msg-row--bot"}`}>
      {!isUser && (
        <div className="msg-avatar" aria-hidden="true">
          AI
        </div>
      )}

      <div className={`bubble ${isUser ? "bubble--user" : "bubble--bot"}`}>
        <span dangerouslySetInnerHTML={{ __html: text }} />
      </div>

      <span className="msg-time">
        {time}
        {isUser && <span className="msg-ticks"> ✓✓</span>}
      </span>

      {isUser && <div className="msg-avatar msg-avatar--hidden" aria-hidden="true" />}
    </div>
  );
};

export default Message;
