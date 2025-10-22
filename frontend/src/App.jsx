
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'



import { useState, useRef, useEffect } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleUpload = async () => {
    if (!file) return alert("Please select a PDF first!");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.status === "uploaded") {
        setIsUploaded(true);
        alert("✅ PDF uploaded successfully! You can now start chatting.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error uploading file");
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    const newMessage = { sender: "user", text: question };
    setMessages((prev) => [...prev, newMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      minWidth:"screen",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "500px",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: "24px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "32px 24px",
          textAlign: "center"
        }}>
          <div style={{
            fontSize: "48px",
            marginBottom: "8px"
          }}>📚</div>
          <h1 style={{
            margin: 0,
            color: "white",
            fontSize: "28px",
            fontWeight: "700",
            letterSpacing: "-0.5px"
          }}>StudyBuddy</h1>
          <p style={{
            margin: "8px 0 0 0",
            color: "rgba(255, 255, 255, 0.9)",
            fontSize: "14px",
            fontWeight: "400"
          }}>Your AI-powered learning companion</p>
        </div>

        <div style={{ padding: "24px" }}>
          {/* Upload Section */}
          {!isUploaded && (
            <div>
              <div style={{
                border: "2px dashed #d1d5db",
                borderRadius: "16px",
                padding: "40px 24px",
                textAlign: "center",
                background: "#f9fafb",
                transition: "all 0.3s ease"
              }}>
                <div style={{
                  fontSize: "40px",
                  marginBottom: "16px"
                }}>📄</div>
                <p style={{
                  margin: "0 0 20px 0",
                  color: "#6b7280",
                  fontSize: "14px"
                }}>Upload your PDF to get started</p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{
                    display: "none"
                  }}
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  style={{
                    display: "inline-block",
                    padding: "12px 24px",
                    background: "white",
                    border: "2px solid #e5e7eb",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    transition: "all 0.2s ease",
                    marginBottom: "16px"
                  }}
                >
                  {file ? file.name : "Choose PDF"}
                </label>
                {file && (
                  <button
                    onClick={handleUpload}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "14px",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.5)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
                    }}
                  >
                    Upload & Start Chatting
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Chat Section */}
          {isUploaded && (
            <>
              <div style={{
                height: "450px",
                overflowY: "auto",
                padding: "16px",
                background: "#f9fafb",
                borderRadius: "16px",
                marginBottom: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                {messages.length === 0 && (
                  <div style={{
                    textAlign: "center",
                    color: "#9ca3af",
                    padding: "40px 20px",
                    fontSize: "14px"
                  }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>💬</div>
                    Ask me anything about your PDF!
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                      animation: "slideIn 0.3s ease"
                    }}
                  >
                    <div style={{
                      background: msg.sender === "user" 
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : "white",
                      color: msg.sender === "user" ? "white" : "#374151",
                      padding: "12px 16px",
                      borderRadius: msg.sender === "user" 
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                      maxWidth: "75%",
                      wordWrap: "break-word",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      boxShadow: msg.sender === "user"
                        ? "0 4px 12px rgba(102, 126, 234, 0.3)"
                        : "0 2px 8px rgba(0, 0, 0, 0.08)"
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{
                    display: "flex",
                    justifyContent: "flex-start"
                  }}>
                    <div style={{
                      background: "white",
                      padding: "12px 16px",
                      borderRadius: "18px 18px 18px 4px",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                      display: "flex",
                      gap: "6px",
                      alignItems: "center"
                    }}>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#667eea",
                        animation: "bounce 1.4s infinite ease-in-out both",
                        animationDelay: "-0.32s"
                      }}></div>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#667eea",
                        animation: "bounce 1.4s infinite ease-in-out both",
                        animationDelay: "-0.16s"
                      }}></div>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#667eea",
                        animation: "bounce 1.4s infinite ease-in-out both"
                      }}></div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div style={{
                display: "flex",
                gap: "8px"
              }}>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onSubmit={handleKeyPress}
                  placeholder="Ask a question..."
                  style={{
                    flex: 1,
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "2px solid #e5e7eb",
                    outline: "none",
                    fontSize: "14px",
                    transition: "border-color 0.2s ease",
                    background: "white",
                    color:"black"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#667eea"}
                  onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                />
                <button
                  onClick={handleAsk}
                  disabled={loading}
                  style={{
                    padding: "14px 24px",
                    background: loading 
                      ? "#d1d5db"
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "14px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "all 0.2s ease",
                    boxShadow: loading ? "none" : "0 4px 12px rgba(102, 126, 234, 0.4)"
                  }}
                  onMouseOver={(e) => {
                    if (!loading) {
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.5)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!loading) {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
                    }
                  }}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        input[type="file"]::-webkit-file-upload-button {
          visibility: hidden;
        }
      `}</style>
    </div>
  );
}

export default App;