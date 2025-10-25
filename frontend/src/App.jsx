import { useState ,useRef,useEffect} from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);
const handleUpload = async () => {
  if (!file) return alert("Please select a PDF first!");

  setUploading(true);
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("https://studybuddy-chatbot-webapp.onrender.com/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (data.status === "processing started" && data.filename) {
      // Recursive polling function
      const pollStatus = async () => {
        try {
          const statusRes = await fetch(`https://studybuddy-chatbot-webapp.onrender.com/status/${data.filename}`);
          const statusData = await statusRes.json();

          if (statusData.status === "done") {
            setIsUploaded(true);
            setUploading(false);
            alert("✅ PDF is ready to use!");
          } else if (statusData.status === "error") {
            setUploading(false);
            alert("❌ Error processing PDF");
          } else {
            // Keep polling every 4 seconds
            setTimeout(pollStatus, 4000);
          }
        } catch (err) {
          console.error("Error checking status:", err);
          // Retry polling even if there was an error
          setTimeout(pollStatus, 4000);
        }
      };

      // Start polling
      pollStatus();
    }
  } catch (err) {
    console.error(err);
    setUploading(false);
    alert("❌ Error uploading file");
  }
};


  const handleAsk = async () => {
  if (!question.trim()) return;

  // Add user message to chat
  setMessages((prev) => [...prev, { sender: "user", text: question }]);
  
  // Prepare payload *before* sending
  const payload = {
    question: question,
    chat_history: messages
  };

  setQuestion("");
  setLoading(true);

  try {
    const res = await fetch("https://studybuddy-chatbot-webapp.onrender.com/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), // use correct payload
    });
    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: data.answer || "I don't know." },
    ]);
  } catch (err) {
    console.error(err);
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: "❌ Error fetching response." },
    ]);
  } finally {
    setLoading(false);
  }
};


  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
  <div className="container">
    <div className="app">
      <div className="chat-card">
        <header className="chat-header">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">📚</div>
              <div className="logo-text">
                <h1>StudyBuddy</h1>
                <p>AI-powered learning companion</p>
              </div>
            </div>
          </div>
        </header>

        <div className="chat-body">
          {!isUploaded ? (
            <div className="upload-section">
              <div className="upload-container">
                <div className="upload-area">
                  <div className="upload-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                  </div>
                  <h2>Upload your PDF</h2>
                  <p>Choose a PDF file to start chatting with your AI assistant</p>
                  
                  <div className="file-input-wrapper">
                    <input
                      type="file"
                      accept="application/pdf"
                      id="file-upload"
                      onChange={(e) => setFile(e.target.files[0])}
                      disabled={uploading}
                    />
                    <label htmlFor="file-upload" className="file-label">
                      {file ? file.name : "Choose PDF"}
                    </label>
                  </div>
                  
                  {file && (
                    <button 
                      onClick={handleUpload} 
                      className="upload-btn"
                      disabled={uploading}
                    >
                      {uploading ? (
                        <div className="loader">
                          <div className="spinner"></div>
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        "Upload & Start Chatting"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="messages">
                {messages.length === 0 ? (
                  <div className="empty-chat">
                    <div className="empty-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    </div>
                    <h3>Ready to chat!</h3>
                    <p>Ask me anything about your PDF document</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`message ${msg.sender === "user" ? "user" : "bot"}`}
                    >
                      <div className="message-content">
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>AI is thinking...</span>
                  </div>
                )}
              </div>

              <div className="input-section">
                <div className="input-container">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask a question about your PDF..."
                    disabled={loading}
                  />
                  <button 
                    onClick={handleAsk} 
                    disabled={loading || !question.trim()}
                    className="send-btn"
                  >
                    {loading ? (
                      <div className="spinner small"></div>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}

export default App;
