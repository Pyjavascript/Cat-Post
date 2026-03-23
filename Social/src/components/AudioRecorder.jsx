import { useEffect, useRef, useState } from "react";

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
      setError("Microphone permission was blocked.");
      stopStream();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleToggleRecording}
        disabled={disabled}
        className={`border px-4 py-2 text-sm font-semibold transition ${
          isRecording
            ? "border-black bg-black text-white"
            : "border-dashed border-slate-300 bg-white text-slate-700 hover:border-black"
        } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        {isRecording ? "Stop Mic" : "Record Audio"}
      </button>
      {previewUrl ? <audio controls src={previewUrl} className="w-full" /> : null}
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
    </div>
  );
}

export default AudioRecorder;
