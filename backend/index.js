import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import fetch from "node-fetch";
import { Server } from "socket.io";
const GOOGLE_API_KEY = "AIzaSyAb_LZ2HdM2kfbNuVsXPWnBkI_3Zi2UiLA";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://tr-ui.vercel.app", // তোমার UI origin
  },
});

// 🎤 Speech-to-Text
async function speechToText(audioBase64) {
  const body = {
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 44100,
      languageCode: "bn-BD",
    },
    audio: {
      content: audioBase64,
    },
  };

  const res = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (!data.results || data.results.length === 0) return "";
  return data.results.map((r) => r.alternatives[0].transcript).join("\n");
}

// 🌐 Translate
async function translateText(text, targetLang = "en") {
  const body = {
    q: text,
    target: targetLang,
    format: "text",
    source: "bn",
  };

  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  return data.data.translations[0].translatedText;
}

// 🔊 Text-to-Speech
async function textToSpeech(text) {
  const body = {
    input: { text },
    voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
    audioConfig: { audioEncoding: "MP3" },
  };

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  return data.audioContent;
}

// 🧠 WebSocket Logic
io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`🚪 ${socket.id} joined room ${roomId}`);
  });

  socket.on("audio", async ({ roomId, audioContent }) => {
    try {
      const text = await speechToText(audioContent);
      const translated = await translateText(text);
      const audio = await textToSpeech(translated);
      socket.to(roomId).emit("translated-audio", audio);
    } catch (err) {
      console.error("❌ Error in processing audio:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
