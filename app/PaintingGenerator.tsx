"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "ai/react";

const themes = ["Renaissance", "Impressionism", "Surrealism", "Abstract", "Pop Art"];

export default function PaintingGenerator() {
  const [theme, setTheme] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
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

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
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

  const generateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const lastAssistantMessage = messages.filter(m => m.role === "assistant").pop();
      if (!lastAssistantMessage) {
        throw new Error("No assistant message found");
      }
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: lastAssistantMessage.content, ...imageParams }),
      });
      const data = await response.json();
      setImageUrl(data.url);
    } catch (error) {
      console.error("Error generating image:", error);
    }
    setIsGeneratingImage(false);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 bg-black text-white min-h-screen">
      <div className="w-full lg:w-1/2 lg:pr-4">
        <h1 className="text-2xl font-bold mb-4 text-yellow-300">Painting Generator</h1>
        
        <div className="mb-4">
          <h2 className="text-xl mb-2 text-yellow-300">Select a Theme:</h2>
          <div className="flex flex-wrap gap-2">
            {themes.map((t) => (
              <button
                key={t}
                onClick={() => handleThemeSelect(t)}
                className={`px-3 py-1 rounded ${
                  theme === t ? "bg-yellow-500 text-black" : "bg-gray-800 text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xl mb-2 text-yellow-300">Your Description:</h2>
          <textarea
            value={userDescription}
            onChange={(e) => setUserDescription(e.target.value)}
            className="w-full p-2 border rounded bg-gray-900 text-white"
            rows={3}
            placeholder="Describe your painting..."
          />
        </div>

        <button
          onClick={generateDescription}
          disabled={(!theme && !userDescription) || isLoading}
          className="w-full sm:w-auto bg-yellow-500 text-black px-4 py-2 rounded mb-4 hover:bg-yellow-600"
        >
          Generate Painting Description
        </button>

        <div className="border border-gray-800 p-4 mb-4 h-64 overflow-y-auto" ref={messagesContainerRef}>
          {messages.map((m) => (
            <div key={m.id} className={`mb-2 ${m.role === "user" ? "text-green-400" : "text-blue-400"}`}>
              <strong>{m.role === "user" ? "User: " : "AI: "}</strong>
              {m.content}
            </div>
          ))}
        </div>

        <div className="mb-4">
          <h2 className="text-xl mb-2 text-yellow-300">Image Generation Parameters:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={imageParams.size}
              onChange={(e) => setImageParams({ ...imageParams, size: e.target.value })}
              className="p-2 border rounded bg-gray-900 text-white"
            >
              <option value="1024x1024">1024x1024</option>
              <option value="512x512">512x512</option>
              <option value="256x256">256x256</option>
            </select>
            <select
              value={imageParams.quality}
              onChange={(e) => setImageParams({ ...imageParams, quality: e.target.value })}
              className="p-2 border rounded bg-gray-900 text-white"
            >
              <option value="standard">Standard</option>
              <option value="hd">HD</option>
            </select>
            <select
              value={imageParams.style}
              onChange={(e) => setImageParams({ ...imageParams, style: e.target.value })}
              className="p-2 border rounded bg-gray-900 text-white"
            >
              <option value="vivid">Vivid</option>
              <option value="natural">Natural</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateImage}
          disabled={messages.length === 0 || isGeneratingImage}
          className="w-full sm:w-auto bg-yellow-500 text-black px-4 py-2 rounded mb-4 hover:bg-yellow-600"
        >
          Generate Image
        </button>

        {isGeneratingImage && <div className="text-center">Generating image...</div>}
      </div>

      <div className="w-full lg:w-1/2 lg:pl-4 mt-8 lg:mt-0">
        {imageUrl && (
          <div>
            <h2 className="text-xl mb-2 text-yellow-300">Generated Image:</h2>
            <img src={imageUrl} alt="Generated painting" className="w-full rounded" />
          </div>
        )}
      </div>
    </div>
  );
}