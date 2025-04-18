require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { handleTranslateStream } = require("./translationHandler.js");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let users = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  users.push(socket);

  socket.on("offer", ({ offer }) => {
    const receiver = users.find((u) => u.id !== socket.id);
    if (receiver) receiver.emit("offer", { offer });
  });

  socket.on("answer", ({ answer }) => {
    const caller = users.find((u) => u.id !== socket.id);
    if (caller) caller.emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ candidate }) => {
    const other = users.find((u) => u.id !== socket.id);
    if (other) other.emit("ice-candidate", { candidate });
  });

  socket.on("audio-chunk", async ({ audioBuffer }) => {
    const translatedAudio = await handleTranslateStream(
      Buffer.from(audioBuffer)
    );
    if (translatedAudio) {
      const receiver = users.find((u) => u.id !== socket.id);
      if (receiver) {
        receiver.emit("translated-audio", { audioBuffer: translatedAudio });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    users = users.filter((u) => u.id !== socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
