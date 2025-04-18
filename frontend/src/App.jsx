import React, { useState } from "react";
import CreateRoom from "./components/CreateRoom";
import JoinRoom from "./components/JoinRoom";
import VoiceStreamer from "./components/VoiceStreamer";

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
