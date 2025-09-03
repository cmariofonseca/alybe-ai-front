"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { Mic, Square, X, Send, MessageCircle } from "lucide-react";

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [message, setMessage] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleMicClick = async () => {
    if (isListening) {
      stopRecording();
    } else {
      await playWelcomeMessage();
    }
  };

  const handleTextInputClick = () => {
    setShowTextInput(true);
  };

  const handleCloseTextInput = () => {
    setShowTextInput(false);
    setMessage("");
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await axios.post("http://localhost:8000/api/messages/save", {
        message: message.trim(),
      });

      setMessage("");
      setShowTextInput(false);
    } catch (error) {
      console.error("Error enviando mensaje:", error);
    }
  };

  const playWelcomeMessage = async () => {
    setIsListening(true);

    try {
      const audioResponse = await axios.post(
        "http://localhost:8000/api/voice/text-to-speech",
        { text: "¿Cúal es tu mensaje?" },
        { responseType: "blob" }
      );

      const audio = new Audio(URL.createObjectURL(audioResponse.data));
      setIsPlaying(true);

      audio.onended = () => {
        setIsPlaying(false);
        startRecording();
      };

      audio.play();
    } catch (error) {
      console.error("Error:", error);
      setIsListening(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const formData = new FormData();
        formData.append("file", audioBlob, "voice-message.webm");

        try {
          await axios.post("http://localhost:8000/api/audio/process", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (error) {
          console.error("❌ Error enviando audio:", error);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error("❌ Error accediendo al micrófono:", error);
      setIsListening(false);
    }
  };

  const stopRecording = () => {
    setIsListening(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="min-h-dvh bg-black flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        {!showTextInput && (
          <button
            onClick={handleMicClick}
            disabled={isPlaying}
            className={`p-8 rounded-full transition-all duration-300 ${
              isListening ? "bg-red-500 scale-110" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isListening ? (
              <Square className="h-12 w-12 text-white" />
            ) : (
              <Mic className="h-12 w-12 text-white" />
            )}
          </button>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-gray-800">
        <div className="max-w-md mx-auto">
          {showTextInput ? (
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full bg-gray-800 text-white rounded-2xl p-4 pr-12 resize-none min-h-[60px] max-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={1}
                autoFocus
              />

              <div className="absolute right-3 bottom-3 flex space-x-2">
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="p-2 bg-blue-500 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5 text-white" />
                </button>

                <button
                  onClick={handleCloseTextInput}
                  className="p-2 bg-gray-600 rounded-full hover:bg-gray-700"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleTextInputClick}
              className="w-full bg-gray-800 text-gray-400 rounded-2xl p-4 text-left hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 text-white" />
                <span>Escribe tu mensaje...</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
