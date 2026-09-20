import { useEffect, useRef, useState } from "react";

const starterMessage = {
    role: "assistant",
    content: "Hello. I am Orbit, a local AI assistant powered by Ollama. What are we thinking through today?"
};
const apiUrl = import.meta.env.VITE_API_URL || "";

function App() {
    const [messages, setMessages] = useState([starterMessage]);
    const [draft, setDraft] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef(null);
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    async function sendMessage(event) {
        event?.preventDefault();
        const content = draft.trim();
        if (!content || isLoading) return;

        const nextMessages = [...messages, { role: "user", content }];
        setMessages(nextMessages);
        setDraft("");
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch(`${apiUrl}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: nextMessages })
            });
            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch {
                throw new Error("The chat API is not connected. Set VITE_API_URL to your deployed backend URL.");
            }
            if (!response.ok) throw new Error(data.error || "The assistant could not respond.");
            setMessages((current) => [...current, data.message]);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    }

    function clearConversation() {
        setMessages([starterMessage]);
        setError("");
        inputRef.current?.focus();
    }

    return (
        <main className="app-shell">
            <header className="topbar">
                <a className="brand" href="/" aria-label="Orbit Chat home">
                    <span className="brand-mark">O</span>
                    <span>ORBIT <em>CHAT</em></span>
                </a>
                <div className="connection-status"><span /> AI assistant</div>
            </header>

            <section className="chat-layout">
                <aside className="intro-panel">
                    {/* <p className="eyebrow">PRIVATE / LOCAL / CURIOUS</p>  */}
                   <h1>Start small.<br /><i>Build bigger.</i></h1>

<p className="intro-copy">
  Start learning Generative AI with small projects, React.js, and real-world ideas — one project at a time.
</p>

<div className="model-badge">
  Build your journey with GenAI 🚀<br />
  <span>— Komal Singh Chauhan</span>
</div>

                    <div className="model-badge">
                        <span className="pulse-dot" />
                        <div><small>MODEL PROVIDER</small><strong>Ollama / cloud</strong></div>
                    </div>
                    <div className="tip"><span>↗</span> Your messages are sent securely to the configured AI service.</div>
                </aside>

                <section className="chat-panel" aria-label="Chat conversation">
                    <div className="chat-heading">
                        <div><p className="eyebrow">CONVERSATION 01</p><h2>Open thread</h2></div>
                        <button className="clear-button" type="button" onClick={clearConversation}>Clear <span>⌘ K</span></button>
                    </div>

                    <div className="messages" aria-live="polite">
                        {messages.map((message, index) => (
                            <article className={`message ${message.role}`} key={`${message.role}-${index}`}>
                                <div className="message-meta">{message.role === "user" ? "YOU" : "ORBIT"}<span>{message.role === "user" ? "" : "· AI"}</span></div>
                                <p>{message.content}</p>
                            </article>
                        ))}
                        {isLoading && <article className="message assistant loading"><div className="message-meta">ORBIT<span>· THINKING</span></div><p><i /><i /><i /></p></article>}
                        {error && <p className="error-message" role="alert">{error}</p>}
                        <div ref={endRef} />
                    </div>

                    <form className="composer" onSubmit={sendMessage}>
                        <textarea
                            ref={inputRef}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(event); } }}
                            placeholder="Ask anything..."
                            rows="1"
                            aria-label="Message Orbit"
                        />
                        <button className="send-button" type="submit" disabled={isLoading || !draft.trim()} aria-label="Send message">↗</button>
                        <div className="composer-hint">Enter to send <span>Shift + Enter for a new line</span></div>
                    </form>
                </section>
            </section>
            <footer><span>ORBIT CHAT</span><span>BUILT WITH REACT · NODE · AI</span></footer>
        </main>
    );
}

export default App;
