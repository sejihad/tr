import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import speechToText from "./services/speechToText.js";
import textToSpeech from "./services/textToSpeech.js";
import translateText from "./services/translateText.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("audio", async ({ roomId, audioContent }) => {
    try {
      const text = await speechToText(audioContent);
      const translated = await translateText(text, "en");
      const audioResponse = await textToSpeech(translated);
      socket.to(roomId).emit("translated-audio", audioResponse);
    } catch (err) {
      console.error("❌ Error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
