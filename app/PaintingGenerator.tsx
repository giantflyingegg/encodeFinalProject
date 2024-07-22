"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "ai/react";

const themes = ["Renaissance", "Impressionism", "Surrealism", "Abstract", "Pop Art"];

export default function PaintingGenerator() {
  const [theme, setTheme] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [imageParams, setImageParams] = useState({
    size: "1024x1024",
    quality: "standard",
    style: "vivid",
  });

  const {
    messages,
    isLoading,
    append,
  } = useChat({
    api: "/api/chat",
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      const newDescription = messages[messages.length - 1].content;
      setDescription(newDescription);
      generateSpeech(newDescription);
    }
  }, [messages]);

  const handleThemeSelect = (selectedTheme: string) => {
    setTheme(selectedTheme);
  };

  const generateDescription = async () => {
    if (!theme && !userDescription) return;
    const promptForAI = `Generate a detailed prompt for image generation of a ${theme} style painting ${userDescription ? `with the following elements: ${userDescription}` : ''}.`;
    await append({
      role: "user",
      content: promptForAI,
    });
  };

  const generateSpeech = async (text: string) => {
    setIsGeneratingAudio(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);

      if (audioRef.current) {
        audioRef.current.play();
      }
    } catch (error) {
      console.error("Error generating speech:", error);
    }
    setIsGeneratingAudio(false);
  };

  const generateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: description, ...imageParams }),
      });
      const data = await response.json();
      setImageUrl(data.url);
    } catch (error) {
      console.error("Error generating image:", error);
    }
    setIsGeneratingImage(false);
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto py-24 px-4">
      <h1 className="text-2xl font-bold mb-4">Painting Generator</h1>
      
      <div className="mb-4">
        <h2 className="text-xl mb-2">Select a Theme:</h2>
        <div className="flex flex-wrap gap-2">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => handleThemeSelect(t)}
              className={`px-3 py-1 rounded ${
                theme === t ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl mb-2">Your Description:</h2>
        <textarea
          value={userDescription}
          onChange={(e) => setUserDescription(e.target.value)}
          className="w-full p-2 border rounded"
          rows={3}
          placeholder="Describe your painting..."
        />
      </div>

      <button
        onClick={generateDescription}
        disabled={(!theme && !userDescription) || isLoading}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
      >
        {isLoading ? 'Generating...' : 'Generate Painting Description'}
      </button>

      {isLoading && (
        <div className="mb-4">
          <p className="text-gray-600">Generating description...</p>
        </div>
      )}

      {description && !isLoading && (
        <div className="mb-4">
          <h2 className="text-xl mb-2">Generated Description:</h2>
          <p className="p-2 bg-gray-100 rounded">{description}</p>
          {audioUrl && (
            <div className="mt-2">
              <audio ref={audioRef} controls src={audioUrl} className="w-full" />
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl mb-2">Image Generation Parameters:</h2>
        <div className="flex flex-col gap-2">
          <select
            value={imageParams.size}
            onChange={(e) => setImageParams({ ...imageParams, size: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="1024x1024">1024x1024</option>
            <option value="512x512">512x512</option>
            <option value="256x256">256x256</option>
          </select>
          <select
            value={imageParams.quality}
            onChange={(e) => setImageParams({ ...imageParams, quality: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="standard">Standard</option>
            <option value="hd">HD</option>
          </select>
          <select
            value={imageParams.style}
            onChange={(e) => setImageParams({ ...imageParams, style: e.target.value })}
            className="p-2 border rounded"
          >
            <option value="vivid">Vivid</option>
            <option value="natural">Natural</option>
          </select>
        </div>
      </div>

      <button
        onClick={generateImage}
        disabled={!description || isGeneratingImage}
        className="bg-purple-500 text-white px-4 py-2 rounded mb-4"
      >
        {isGeneratingImage ? 'Generating Image...' : 'Generate Image'}
      </button>

      {isGeneratingImage && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2">Generating image...</p>
        </div>
      )}

      {isGeneratingAudio && <div className="text-center">Generating audio...</div>}

      {imageUrl && (
        <div className="mt-4">
          <h2 className="text-xl mb-2">Generated Image:</h2>
          <img src={imageUrl} alt="Generated painting" className="w-full" />
        </div>
      )}
    </div>
  );
}