import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import fetch from "node-fetch";
import { Server } from "socket.io";
const GOOGLE_API_KEY = "AIzaSyAb_LZ2HdM2kfbNuVsXPWnBkI_3Zi2UiLA";
// .env ফাইল থেকে ভেরিয়েবল লোড করা
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Google API Services: Speech-to-Text
async function speechToText(audioBuffer) {
  const audioBytes = audioBuffer.toString("base64");

  const body = {
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 44100,
      languageCode: "bn-BD", // বাংলা ভাষা
    },
    audio: {
      content: audioBytes,
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

// Google API Services: Text-to-Speech
async function textToSpeech(text) {
  const body = {
    input: { text },
    voice: {
      languageCode: "en-US", // ইংরেজি ভাষায় রূপান্তর
      ssmlGender: "NEUTRAL",
    },
    audioConfig: {
      audioEncoding: "MP3",
    },
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

// Google API Services: Translate
async function translateText(text, targetLang = "en") {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`;

  const body = {
    q: text,
    target: targetLang,
    format: "text",
    source: "bn", // বাংলা থেকে
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (
    data &&
    data.data &&
    data.data.translations &&
    data.data.translations.length > 0
  ) {
    return data.data.translations[0].translatedText;
  } else {
    throw new Error("Translation failed");
  }
}

// HTTP server তৈরি করা
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://tr-ui.vercel.app", // Frontend-এর URL
  },
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // যখন ক্লায়েন্ট থেকে অডিও আসবে তখন তা প্রক্রিয়া করা
  socket.on("audio", async ({ roomId, audioContent }) => {
    try {
      // অডিও থেকে টেক্সট কনভার্ট
      const text = await speechToText(audioContent);
      // টেক্সট ট্রান্সলেট করা
      const translated = await translateText(text, "en");
      // ট্রান্সলেটেড টেক্সট থেকে আবার অডিও তৈরি করা
      const audioResponse = await textToSpeech(translated);
      // সেই অডিও আবার রুমে থাকা অন্যদের কাছে পাঠানো
      socket.to(roomId).emit("translated-audio", audioResponse);
    } catch (err) {
      console.error("❌ Error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Server শুরু করা
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
