import { ReactMic } from "react-mic";
import { useState } from "react";
function AudioRecorder() {
  const [record, setRecord] = useState(false);
//   const [start, setStart] = useState(false);
  const onStop = (recordedBlob) => {
    console.log("Recorded Blob:", recordedBlob);
    const audioFile = new File([recordedBlob.blob], "voiceMessage.webm", {
      type: "audio/webm",
    });
    const formData = new FormData();
    formData.append("voice", audioFile);
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
          {record ? <img src="./mute.png" /> : <img src="./mic.png" />}
        </button>
      </div>
    </div>
  );
}

export default AudioRecorder;
