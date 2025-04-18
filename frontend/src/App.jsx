import React, { useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom"; // useNavigate যোগ করুন
import Meeting from "./Meeting.jsx";

function App() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate(); // useNavigate হুক ব্যবহার করুন

  const handleCreateRoom = () => {
    fetch("https://tr-api-wpt2.onrender.com/create-room")
      .then((res) => res.text())
      .then((id) => {
        setRoomId(id);
        navigate(`/room/${id}`);
      });
  };

  const handleJoinRoom = () => {
    const id = prompt("Enter meeting ID:");
    if (id) {
      setRoomId(id);
      navigate(`/room/${id}`);
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <h1>Basic Meet</h1>
            <button onClick={handleCreateRoom}>Create New Meeting</button>
            <button onClick={handleJoinRoom}>Join Meeting</button>
            {roomId && <p>Your meeting ID: {roomId}</p>}
          </div>
        }
      />
      <Route path="/room/:roomId" element={<Meeting />} />
    </Routes>
  );
}

export default App;
