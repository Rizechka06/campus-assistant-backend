import ChatWindow from "./components/ChatWindow";
import PdfUpload from "./components/PdfUpload";

function App() {
  return (
    <div className="app">
      <h1>Lecture AI Assistant</h1>

      <PdfUpload />

      <ChatWindow />
    </div>
  );
}

export default App;