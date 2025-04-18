import React, { useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io("https://tr-api-m7yy.onrender.com");

function VoiceStreamer({ roomId }) {
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    socket.emit("join-room", roomId);

    socket.on("translated-audio", (audioBase64) => {
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      audio.play();
    });

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
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

export default VoiceStreamer;
