import { useRef, useState } from 'react';
import * as aiApi from '../aiApi';

export default function VoiceRecorderButton({ projectId, onResult }) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setBusy(true);
      try {
        const res = await aiApi.sendVoiceCommand(projectId, blob);
        onResult(res.data);
      } finally {
        setBusy(false);
      }
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <button
      type="button"
      onClick={recording ? stopRecording : startRecording}
      disabled={busy}
      className={`px-3 py-2 rounded-lg text-sm font-semibold ${
        recording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      title={recording ? 'Stop recording' : 'Record voice command'}
    >
      {busy ? '...' : recording ? '⏹' : '🎤'}
    </button>
  );
}
