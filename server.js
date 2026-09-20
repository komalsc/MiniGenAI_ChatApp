import express from "express";
import ollama from "ollama";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const model = process.env.OLLAMA_MODEL || "llama3.2";
const maxMessages = 20;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_request, response) => {
    response.json({ status: "ok", model });
});

app.post("/api/chat", async (request, response) => {
    const { messages } = request.body;

    if (!Array.isArray(messages) || messages.length === 0) {
        return response.status(400).json({ error: "messages must be a non-empty array" });
    }

    const validMessages = messages
        .filter((message) => message && ["user", "assistant"].includes(message.role))
        .map((message) => ({
            role: message.role,
            content: String(message.content || "").trim()
        }))
        .filter((message) => message.content.length > 0)
        .slice(-maxMessages);

    if (validMessages.length === 0 || validMessages.at(-1).role !== "user") {
        return response.status(400).json({ error: "The last message must be from the user" });
    }

    try {
        const result = await ollama.chat({ model, messages: validMessages });
        return response.json({ message: result.message, model });
    } catch (error) {
        console.error("Ollama request failed:", error.message);
        return response.status(502).json({
            error: "Could not reach Ollama. Make sure Ollama is running and the model is installed."
        });
    }
});

const clientPath = path.join(__dirname, "dist");
app.use(express.static(clientPath));
app.get(/.*/, (_request, response) => {
    response.sendFile(path.join(clientPath, "index.html"));
});

export function createServer() {
    return app;
}

