import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const socket = io("https://tr-api-tki6.onrender.com");

function App() {
  const [roomId, setRoomId] = useState(null);
  const [joinId, setJoinId] = useState("");
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    socket.emit("join-room", roomId);
    console.log("🔗 Joined room:", roomId);

    socket.on("translated-audio", (audioBase64) => {
      try {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0))],
          { type: "audio/mp3" }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      } catch (err) {
        console.error("🔇 Audio playback failed:", err.message);
      }
    });

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Audio = reader.result.split(",")[1];
              socket.emit("audio", { roomId, audioContent: base64Audio });
            };
            reader.readAsDataURL(e.data);
          }
        };

        mediaRecorder.start(3000);
      })
      .catch((err) => {
        console.error("🎤 Mic permission error:", err.message);
      });

    return () => {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      socket.disconnect();
    };
  }, [roomId]);

  const handleCreate = () => {
    const id = uuidv4();
    setRoomId(id);
  };

  const handleJoin = () => {
    if (joinId.trim()) setRoomId(joinId.trim());
  };

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      {!roomId ? (
        <>
          <button onClick={handleCreate}>📞 Create Meeting</button>
          <br />
          <br />
          <input
            type="text"
            placeholder="Enter Meeting ID"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
          />
          <button onClick={handleJoin}>✅ Join</button>
        </>
      ) : (
        <div>
          <h3>🔊 You are in room: {roomId}</h3>
          <p>Start speaking! Translated voice will play in real-time.</p>
        </div>
      )}
    </div>
  );
}

export default App;
