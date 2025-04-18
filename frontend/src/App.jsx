import React, { useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io("https://your-backend-url.onrender.com"); // 🔁 Replace with your backend URL

function App() {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    socket.emit("join-room", "myroom");

    socket.on("translated-audio", (audioBase64) => {
      try {
        const binaryString = window.atob(audioBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: "audio/mp3" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      } catch (err) {
        console.error("🔇 Audio playback failed:", err.message);
      }
    });

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/wav",
          });
          audioChunksRef.current = [];
          const arrayBuffer = await audioBlob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          socket.emit("audio", {
            roomId: "myroom",
            audioContent: Array.from(uint8Array),
          });
        };

        setInterval(() => {
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
          ) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.start();
          }
        }, 4000);

        mediaRecorderRef.current.start();
      } catch (err) {
        console.error("🎙️ Microphone error:", err.message);
      }
    };

    startRecording();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>🔁 Real-time Voice Translator (Bengali to English)</h2>
      <p>Speak something in Bengali… it’ll speak back in English.</p>
    </div>
  );
}

export default App;
