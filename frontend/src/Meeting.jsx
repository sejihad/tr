import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const Meeting = () => {
  const { roomId } = useParams();
  const localVideo = useRef();
  const remoteVideo = useRef();
  const socket = useRef();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  useEffect(() => {
    socket.current = io("http://localhost:5000");

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        localVideo.current.srcObject = stream;
        stream
          .getAudioTracks()
          .forEach((track) => (track.enabled = isAudioEnabled));

        socket.current.emit("join-room", roomId, (success) => {
          if (success) {
            console.log("Joined room:", roomId);
          } else {
            alert("Invalid room ID");
          }
        });

        socket.current.on("user-connected", (userId) => {
          console.log("User connected:", userId);
        });

        socket.current.on("other-user", (otherUserId) => {
          callUser(otherUserId, stream);
        });

        socket.current.on("user-joined", (signalingUserId) => {
          console.log("User joined:", signalingUserId);
        });

        socket.current.on("offer", async (signal, from) => {
          const peerConnection = createPeerConnection();
          setLocalStream(stream);
          peerConnection.ontrack = (event) => {
            remoteVideo.current.srcObject = event.streams[0];
          };
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(signal)
          );
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.current.emit("answer", answer, from);
          peerConnection.addStream(stream);
          setConnections((prev) => ({ ...prev, [from]: peerConnection }));
        });

        socket.current.on("answer", async (signal, from) => {
          await connections[from]?.setRemoteDescription(
            new RTCSessionDescription(signal)
          );
        });

        socket.current.on("ice-candidate", async (candidate, from) => {
          await connections[from]?.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        });

        socket.current.on("user-disconnected", (userId) => {
          console.log("User disconnected:", userId);
          if (connections[userId]) {
            connections[userId].close();
            const updatedConnections = { ...connections };
            delete updatedConnections[userId];
            setConnections(updatedConnections);
          }
        });
      })
      .catch((error) => console.error("Error accessing media devices:", error));

    return () => {
      socket.current.disconnect();
    };
  }, [roomId, isAudioEnabled]);

  const [localStream, setLocalStream] = useState(null);
  const [connections, setConnections] = useState({});

  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit(
          "ice-candidate",
          event.candidate,
          Object.keys(connections).find(
            (key) => connections[key] === peerConnection
          )
        );
      }
    };

    return peerConnection;
  };

  const callUser = async (otherUserId, stream) => {
    const peerConnection = createPeerConnection();
    setConnections((prev) => ({ ...prev, [otherUserId]: peerConnection }));
    setLocalStream(stream);
    peerConnection.ontrack = (event) => {
      remoteVideo.current.srcObject = event.streams[0];
    };
    stream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, stream));

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.current.emit("offer", offer, otherUserId);
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !isAudioEnabled));
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  return (
    <div>
      <h2>Meeting ID: {roomId}</h2>
      <video ref={localVideo} autoPlay muted />
      <video ref={remoteVideo} autoPlay />
      <button onClick={toggleAudio}>
        {isAudioEnabled ? "Mute" : "Unmute"}
      </button>
    </div>
  );
};

export default Meeting;
