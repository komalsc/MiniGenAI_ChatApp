import "dotenv/config";
import express from "express";
import ollama from "ollama";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const provider = process.env.AI_PROVIDER || "ollama";
const model = provider === "openrouter"
    ? (process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini")
    : (process.env.OLLAMA_MODEL || "llama3.2");
const maxMessages = 20;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "32kb" }));
app.use(cors({
    origin: process.env.FRONTEND_URL || true
}));

app.get("/api/health", (_request, response) => {
    response.json({ status: "ok", provider, model });
});

async function askModel(messages) {
    if (provider === "openrouter") {
        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error("OPENROUTER_API_KEY is not configured");
        }

        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
                "X-Title": "Orbit Chat"
            },
            body: JSON.stringify({ model, messages })
        });
        const data = await openRouterResponse.json();
        if (!openRouterResponse.ok) {
            throw new Error(data.error?.message || "The hosted model request failed");
        }
        return data.choices?.[0]?.message;
    }

    const result = await ollama.chat({ model, messages });
    return result.message;
}

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
        const message = await askModel(validMessages);
        if (!message?.content) throw new Error("The model returned an empty response");
        return response.json({ message, model, provider });
    } catch (error) {
        console.error(`${provider} request failed:`, error.message);
        return response.status(502).json({
            error: provider === "openrouter"
                ? "The hosted AI service could not respond. Check the server API key and model settings."
                : "Could not reach Ollama. Make sure Ollama is running and the model is installed."
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

