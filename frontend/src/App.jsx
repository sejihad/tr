import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const socket = io("https://tr-api-m7yy.onrender.com");

function CreateRoom({ onCreate }) {
  const handleCreate = () => {
    const id = uuidv4();
    onCreate(id);
  };

  return <button onClick={handleCreate}>📞 Create Meeting</button>;
}

function JoinRoom({ onJoin }) {
  const [roomId, setRoomId] = useState("");

  const handleJoin = () => {
    if (roomId.trim()) {
      onJoin(roomId.trim());
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter Meeting ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={handleJoin}>✅ Join</button>
    </div>
  );
}

function VoiceStreamer({ roomId }) {
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    socket.emit("join-room", roomId);

    socket.on("translated-audio", (audioBase64) => {
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      audio.play();
    });

    // Request for microphone permission and start recording
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = async (e) => {
          if (e.data.size > 0) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Audio = reader.result.split(",")[1];
              socket.emit("audio", { roomId, audioContent: base64Audio });
            };
            reader.readAsDataURL(e.data);
          }
        };

        mediaRecorder.start(3000); // every 3s send chunk
      })
      .catch((err) => {
        console.error("Permission denied or error occurred", err);
      });

    return () => {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      socket.disconnect();
    };
  }, [roomId]);

  return (
    <div>
      <h3>🔊 You are in room: {roomId}</h3>
      <p>Start speaking! Real-time translation will stream to other user.</p>
    </div>
  );
}

function App() {
  const [roomId, setRoomId] = useState(null);

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      {!roomId ? (
        <>
          <CreateRoom onCreate={setRoomId} />
          <JoinRoom onJoin={setRoomId} />
        </>
      ) : (
        <VoiceStreamer roomId={roomId} />
      )}
    </div>
  );
}

export default App;
