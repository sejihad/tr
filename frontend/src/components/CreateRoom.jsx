import React from "react";
import { v4 as uuidv4 } from "uuid";

function CreateRoom({ onCreate }) {
  const handleCreate = () => {
    const id = uuidv4();
    onCreate(id);
  };

  return <button onClick={handleCreate}>📞 Create Meeting</button>;
}

export default CreateRoom;
