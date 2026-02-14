import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { useEntity } from "../../context/EntityContext";
import "./AISmartSearch.css";

export default function AISmartSearch() {
    const { entity } = useEntity();
    const [query, setQuery] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatHistory]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Listen for external open events
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener("open-ai-chat", handleOpen);
        return () => window.removeEventListener("open-ai-chat", handleOpen);
    }, []);

    const sendMessage = async (messageText) => {
        if (!messageText.trim() || loading) return;

        const userMessage = messageText.trim();
        setQuery("");
        setChatHistory((prev) => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        try {
            const response = await api.smartSearch(userMessage, entity);
            const result = response.result;

            let botMessage = "";
            let data = null;

            if (result.type === "count") {
                botMessage = `${result.message}\n\n${result.explanation}`;
            } else if (result.type === "health") {
                botMessage = `${result.message}\n\nFleet Health: ${result.summary.averageScore}% (Grade ${result.summary.averageGrade})\n${result.summary.healthyPercentage}% of assets are healthy.\n${result.summary.replacementNeeded} need replacement.`;
                data = result.assets?.slice(0, 5);
            } else {
                botMessage = result.message;
                data = result.assets?.slice(0, 8);
            }

            setChatHistory((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: botMessage,
                    data,
                    confidence: response.query?.confidence,
                    explanation: response.query?.explanation
                }
            ]);
        } catch (err) {
            setChatHistory((prev) => [
                ...prev,
                { role: "assistant", content: `Sorry, something went wrong: ${err.message}`, error: true }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        sendMessage(query);
    };

    const suggestions = [
        "Show laptops under repair",
        "How many assets are available?",
        "Show oldest desktops",
        "Health of all assets",
        "Count printers in use"
    ];

    return (
        <>
            {/* Floating AI Button */}
            <button
                className={`ai-fab ${isOpen ? "active" : ""}`}
                onClick={() => setIsOpen(!isOpen)}
                title="AI Assistant"
            >
                {isOpen ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                )}
                <span className="ai-fab-pulse" />
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="ai-chat-panel">
                    <div className="ai-chat-header">
                        <div className="ai-chat-header-left">
                            <div className="ai-avatar">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div>
                                <h4>ITAM AI Assistant</h4>
                                <span className="ai-status-dot" /> Online
                            </div>
                        </div>
                        <button className="ai-chat-close" onClick={() => setIsOpen(false)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <div className="ai-chat-body">
                        {chatHistory.length === 0 && (
                            <div className="ai-welcome">
                                <div className="ai-welcome-icon">💡</div>
                                <h4>Hi! I'm your AI Asset Assistant</h4>
                                <p>Ask me anything about your assets using natural language.</p>
                                <div className="ai-suggestions">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            className="ai-suggestion-chip"
                                            onClick={() => sendMessage(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`ai-message ${msg.role}`}>
                                <div className="ai-message-content">
                                    {msg.role === "assistant" && (
                                        <div className="ai-msg-avatar">💡</div>
                                    )}
                                    <div className="ai-msg-bubble">
                                        <p>{msg.content}</p>
                                        {msg.confidence !== undefined && (
                                            <span className="ai-confidence">
                                                Confidence: {Math.round(msg.confidence * 100)}%
                                            </span>
                                        )}
                                        {msg.data && msg.data.length > 0 && (
                                            <div className="ai-results-table">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Asset</th>
                                                            <th>Category</th>
                                                            <th>Status</th>
                                                            {msg.data[0].score !== undefined && <th>Health</th>}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {msg.data.map((item, i) => (
                                                            <tr key={i}>
                                                                <td>{item.name || item.assetId || item.id}</td>
                                                                <td>{item.category || "—"}</td>
                                                                <td>
                                                                    <span className={`ai-status-tag ${(item.status || "").toLowerCase().replace(/\s/g, "-")}`}>
                                                                        {item.status || "—"}
                                                                    </span>
                                                                </td>
                                                                {item.score !== undefined && (
                                                                    <td>
                                                                        <span className={`ai-health-badge grade-${(item.grade || "C").toLowerCase()}`}>
                                                                            {item.score}% {item.grade}
                                                                        </span>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="ai-message assistant">
                                <div className="ai-message-content">
                                    <div className="ai-msg-avatar">💡</div>
                                    <div className="ai-msg-bubble">
                                        <div className="ai-typing">
                                            <span /><span /><span />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    <form className="ai-chat-input" onSubmit={handleSubmit}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask about your assets..."
                            disabled={loading}
                        />
                        <button type="submit" disabled={!query.trim() || loading}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
