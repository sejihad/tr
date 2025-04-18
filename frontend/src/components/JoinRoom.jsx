import React, { useState } from "react";

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

export default JoinRoom;
