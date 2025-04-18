import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [isCalling, setIsCalling] = useState(false);
  const localStream = useRef(null);
  const mediaRecorder = useRef(null);
  const peerConnection = useRef(null);
  const audioContext = useRef(
    new (window.AudioContext || window.webkitAudioContext)()
  );

  useEffect(() => {
    socket.on("offer", async ({ offer }) => {
      await handleReceiveCall(offer);
    });

    socket.on("answer", async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (peerConnection.current) {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("translated-audio", ({ audioBuffer }) => {
      const blob = new Blob([audioBuffer], { type: "audio/wav" });
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play();
    });
  }, []);

  const startCall = async () => {
    setIsCalling(true);
    peerConnection.current = new RTCPeerConnection();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStream.current = stream;

    stream
      .getTracks()
      .forEach((track) => peerConnection.current.addTrack(track, stream));

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate });
      }
    };

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socket.emit("offer", { offer });

    startRecording();
  };

  const handleReceiveCall = async (offer) => {
    peerConnection.current = new RTCPeerConnection();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStream.current = stream;

    stream
      .getTracks()
      .forEach((track) => peerConnection.current.addTrack(track, stream));

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate });
      }
    };

    await peerConnection.current.setRemoteDescription(offer);
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
    socket.emit("answer", { answer });

    startRecording();
  };

  const startRecording = () => {
    const recorder = new MediaRecorder(localStream.current, {
      mimeType: "audio/webm",
    });

    recorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        const arrayBuffer = await event.data.arrayBuffer();
        socket.emit("audio-chunk", { audioBuffer: arrayBuffer });
      }
    };

    recorder.start(1000); // send every 1 second
    mediaRecorder.current = recorder;
  };

  const endCall = () => {
    mediaRecorder.current?.stop();
    localStream.current?.getTracks().forEach((track) => track.stop());
    peerConnection.current?.close();
    setIsCalling(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>🔊 1v1 Voice Call with Live Translation</h1>
      {!isCalling ? (
        <button onClick={startCall}>📞 Start Call</button>
      ) : (
        <button onClick={endCall}>❌ End Call</button>
      )}
    </div>
  );
}

export default App;
