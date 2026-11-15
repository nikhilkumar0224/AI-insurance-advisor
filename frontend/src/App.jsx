import "./App.css";
import React from "react";

export default function App() {
  return (
    <main className="app">
      <h1>Tina - Your AI Insurance Policy Assistant</h1>

      <div className="chat-box"></div>

      <form>
        <label></label>
        <textarea />

        <div className="buttons">
          <button type="submit">Submit</button>
          <button type="button" className="start-button">
            Start Again
          </button>
        </div>
      </form>
    </main>
  );
}
