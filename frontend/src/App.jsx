import "./App.css";
import React from "react";
import { useState, useEffect, useRef } from "react";

const Opt_In_Message =
  "I'm Tina. I help you to choose the right insurance policy. May I ask you a few personal questions to make sure I recommend the best policy for you?";

// tina start message
const startingMessages = [{ role: "tina", text: Opt_In_Message }];

export default function App() {
  const [messages, setMessages] = useState(startingMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);

  // for scroll chat box to newest message
  const chatRef = useRef(null);
  useEffect(() => {
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  // for click submit
  async function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const updated = [...messages, { role: "user", text: text }];
    setMessages(updated);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.error || "The server is not responding. Is the backend running?",
        );
      }
      setMessages([...updated, { role: "tina", text: data.reply }]);
      setFinished(data.finished);
    } catch (err) {
      setMessages(messages);
      setInput(text);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // for start again
  function handleReset() {
    setMessages(startingMessages);
    setInput("");
    setError("");
    setFinished(false);
  }
  return (
    <main className="app">
      <h1 className="heading">Tina - Your AI Insurance Policy Assistant</h1>

      <div className="chat-box" ref={chatRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <strong>{msg.role === "tina" ? "Tina" : "You"}</strong>
            <p>{msg.text}</p>
          </div>
        ))}
        {loading && <p className="typing">Tina is typing...</p>}
      </div>
      {error && <p className="error">{error}</p>}
      {finished && (
        <p className="finished">
          The chat is finished. Click "Start again" to try another one.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <label htmlFor="reply">Your reply</label>
        <textarea
          id="reply"
          rows={3}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your reply here..."
          maxLength={1000}
          disabled={loading || finished}
        />
        <div className="buttons">
          <button
            type="submit"
            disabled={loading || finished || input.trim() === ""}
          >
            Submit
          </button>
          <button
            type="button"
            className="secondary"
            onClick={handleReset}
            disabled={loading}
          >
            Start again
          </button>
        </div>
      </form>
    </main>
  );
}
