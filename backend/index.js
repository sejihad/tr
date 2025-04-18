const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const app = express();

const server = http.createServer(app);
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("create-room", (callback) => {
    const roomId = uuidv4();
    rooms[roomId] = { participants: [socket.id] };
    socket.join(roomId);
    callback(roomId);
    socket.emit("user-connected", socket.id);
  });

  socket.on("join-room", (roomId, callback) => {
    if (rooms[roomId]) {
      rooms[roomId].participants.push(socket.id);
      socket.join(roomId);
      callback(true);
      io.to(roomId).emit("user-connected", socket.id);
      if (rooms[roomId].participants.length > 1) {
        const otherUser = rooms[roomId].participants.find(
          (id) => id !== socket.id
        );
        socket.emit("other-user", otherUser);
        socket.to(otherUser).emit("user-joined", socket.id);
      }
    } else {
      callback(false);
    }
  });

  socket.on("offer", (signal, to) => {
    io.to(to).emit("offer", signal, socket.id);
  });

  socket.on("answer", (signal, to) => {
    io.to(to).emit("answer", signal, socket.id);
  });

  socket.on("ice-candidate", (candidate, to) => {
    io.to(to).emit("ice-candidate", candidate, socket.id);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    for (const roomId in rooms) {
      if (rooms[roomId].participants.includes(socket.id)) {
        rooms[roomId].participants = rooms[roomId].participants.filter(
          (id) => id !== socket.id
        );
        io.to(roomId).emit("user-disconnected", socket.id);
        if (rooms[roomId].participants.length === 0) {
          delete rooms[roomId];
        }
        break;
      }
    }
  });
});

app.get("/create-room", (req, res) => {
  const roomId = uuidv4();
  rooms[roomId] = { participants: [] };
  res.send(roomId);
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
