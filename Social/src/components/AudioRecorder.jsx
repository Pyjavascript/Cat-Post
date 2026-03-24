/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import IonIcon from "./IonIcon";

function AudioRecorder({ onRecorded, disabled = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [previewUrl]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleToggleRecording = async () => {
    if (disabled) {
      return;
    }

    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    try {
      setError("");
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const nextPreviewUrl = URL.createObjectURL(audioBlob);

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(nextPreviewUrl);
        onRecorded?.(audioBlob);
        stopStream();
      };

      recorder.start();
      setIsRecording(true);
    } catch (mediaError) {
      console.error("Audio recording failed:", mediaError);
      setError(mediaError.message || "Microphone permission was blocked.");
      stopStream();
    }
  };

  const handleClearRecording = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
    setError("");
    onRecorded?.(null);
  };

  return (
    <div className="recorder-shell">
      <div className="recorder-row">
        <button
          type="button"
          onClick={handleToggleRecording}
          disabled={disabled}
          className={`recorder-button inline-flex items-center gap-2 ${isRecording ? "recorder-button-active" : ""}`}
        >
          <IonIcon name={isRecording ? "stop-circle-outline" : "mic-outline"} className="text-base" />
          {isRecording ? "Stop microphone" : "Record voice note"}
        </button>
        {previewUrl ? (
          <button
            type="button"
            onClick={handleClearRecording}
            className="recorder-clear-button inline-flex items-center gap-2"
          >
            <IonIcon name="close-circle-outline" className="text-base" />
            Clear
          </button>
        ) : null}
      </div>
      {previewUrl ? <audio controls src={previewUrl} className="recorder-preview" /> : null}
      {error ? <p className="recorder-error">{error}</p> : null}
    </div>
  );
}

export default AudioRecorder;
