import { ReactMic } from "react-mic";
import { useState, useEffect } from "react";
import { monitorAuthState } from "../firebase/index";
import { v4 as uuidv4 } from "uuid";

function AudioRecorder() {
  const [user, setUser] = useState(null);
  const [record, setRecord] = useState(false);

  useEffect(() => {
    monitorAuthState((currentUser) => {
      setUser(currentUser);
      console.log("User:", currentUser);
    });
  }, []);

  const onStop = async (recordedBlob) => {
    console.log("Recorded Blob:", recordedBlob);
    
    const audioFile = new File([recordedBlob.blob], "voiceMessage.webm", {
      type: "audio/webm",
    });

    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audioFile); // ✅ Must match `multer.single("audio")` in the backend
    formData.append("text", ""); // Placeholder for now
    formData.append("img", ""); // Placeholder
    formData.append("userId", user.uid);
    formData.append("postId", uuidv4());
    formData.append("user", user.email);

    try {
      const response = await fetch("http://localhost:5000/post", {
        method: "POST",
        body: formData, // ✅ Send FormData instead of JSON
      });

      if (response.ok) {
        console.log("✅ Post saved successfully!");
      } else {
        console.error("❌ Failed to save post to backend");
      }
    } catch (error) {
      console.error("❌ Error posting data:", error);
    }
  };

  return (
    <div>
      <div className="hidden">
        <ReactMic record={record} onStop={onStop} mimeType="audio/webm" />
      </div>
      <div>
        <button
          onClick={() => setRecord((prev) => !prev)}
          className="flex justify-center items-center w-7"
        >
          {record ? <img src="./mute.png" alt="Stop Recording" /> : <img src="./mic.png" alt="Start Recording" />}
        </button>
      </div>
    </div>
  );
}

export default AudioRecorder;
