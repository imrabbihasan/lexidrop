import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { explainWord } from "./services/ai";

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Root route for convenience
app.get("/", (_req: Request, res: Response) => {
    res.json({
        message: "LexiDrop API is running 🚀",
        endpoints: {
            health: "GET /health",
            words: "GET /api/words",
            save: "POST /api/save",
        },
    });
});

/**
 * POST /api/save
 * Accepts { text: string, targetLang?: string }
 * Saves entry as PENDING, triggers Gemini AI async, updates to COMPLETED
 */
app.post("/api/save", async (req: Request, res: Response) => {
    try {
        const { text, targetLang = "English" } = req.body;

        if (!text || typeof text !== "string") {
            res.status(400).json({ error: "Missing or invalid 'text' field" });
            return;
        }

        const trimmedText = text.trim();

        // Check for existing entry (case-insensitive)
        const existingEntry = await prisma.wordEntry.findFirst({
            where: {
                originalText: {
                    equals: trimmedText
                }
            }
        });

        if (existingEntry) {
            res.status(200).json({
                message: "Word already exists",
                id: existingEntry.id,
                existing: true
            });
            return;
        }

        // Create entry with PENDING status
        const entry = await prisma.wordEntry.create({
            data: {
                originalText: trimmedText,
                status: "PENDING",
            },
        });

        // Send immediate response
        res.status(201).json({
            message: "Word saved, processing...",
            id: entry.id,
        });

        // Process AI asynchronously (don't await in response)
        processWordAsync(entry.id, trimmedText, targetLang);
    } catch (error) {
        console.error("Error saving word:", error);
        res.status(500).json({ error: "Failed to save word" });
    }
});

/**
 * Process word explanation asynchronously
 */
async function processWordAsync(
    id: number,
    text: string,
    targetLang: string
): Promise<void> {
    try {
        console.log(`Processing word: "${text}" (ID: ${id})`);

        const result = await explainWord(text, targetLang);

        await prisma.wordEntry.update({
            where: { id },
            data: {
                translatedText: result.translatedText,
                explanation: result.explanation,
                status: "COMPLETED",
            },
        });

        console.log(`Completed processing word: "${text}" (ID: ${id})`);
    } catch (error) {
        console.error(`Failed to process word ID ${id}:`, error);

        await prisma.wordEntry.update({
            where: { id },
            data: {
                status: "FAILED",
                explanation: error instanceof Error ? error.message : "Unknown error",
            },
        });
    }
}

/**
 * GET /api/words
 * Returns all COMPLETED words
 */
app.get("/api/words", async (_req: Request, res: Response) => {
    try {
        const words = await prisma.wordEntry.findMany({
            where: { status: "COMPLETED" },
            orderBy: { createdAt: "desc" },
        });

        res.json(words);
    } catch (error) {
        console.error("Error fetching words:", error);
        res.status(500).json({ error: "Failed to fetch words" });
    }
});

/**
 * GET /api/words/all
 * Returns all words (including PENDING and FAILED) - useful for debugging
 */
app.get("/api/words/all", async (_req: Request, res: Response) => {
    try {
        const words = await prisma.wordEntry.findMany({
            orderBy: { createdAt: "desc" },
        });

        res.json(words);
    } catch (error) {
        console.error("Error fetching words:", error);
        res.status(500).json({ error: "Failed to fetch words" });
    }
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 LexiDrop server running on http://localhost:${PORT}`);
    console.log(`📚 API endpoints:`);
    console.log(`   POST /api/save - Save a new word`);
    console.log(`   GET  /api/words - Get all completed words`);
    console.log(`   GET  /api/words/all - Get all words (debug)`);
    console.log(`   GET  /health - Health check`);
});

// endpoint to delete a word
app.delete("/api/words/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: "Invalid ID" });
            return;
        }

        await prisma.wordEntry.delete({
            where: { id: id },
        });

        res.json({ message: "Word deleted successfully" });
    } catch (error) {
        console.error("Error deleting word:", error);
        res.status(500).json({ error: "Failed to delete word" });
    }
});

const handleShutdown = async (signal: string) => {
    console.log("\nShutting down...");
    await prisma.$disconnect();
    process.exit(0);
};

// Graceful shutdown
process.on("SIGINT", handleShutdown);
