"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "ai/react";

const sdxlCategories = [
  "Photorealistic Landscapes",
  "Detailed Portraits",
  "Complex Architectural Designs",
  "Fine Art Recreations",
  "Intricate Textures and Patterns"
];

const dreamshaperCategories = [
  "Fantasy Creatures",
  "Sci-Fi Environments",
  "Stylized Character Designs",
  "Abstract Concept Visualizations",
  "Surreal Dreamscapes"
];

function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: any[]) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export default function StableDiffusionShowcase() {
  const [model, setModel] = useState<"sdxl" | "dreamshaper">("sdxl");
  const [category, setCategory] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
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
    body: { model, category },
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const lastProcessedMessageRef = useRef<string | null>(null);

  const handleModelSelect = (selectedModel: "sdxl" | "dreamshaper") => {
    setModel(selectedModel);
    setCategory(""); // Reset category when model changes
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
  };

  const generatePrompt = async () => {
    if (!category && !userDescription) return;
    const promptForAI = `Generate a detailed prompt for image generation of a ${category} using ${model === "sdxl" ? "SDXL" : "Dreamshaper"} ${userDescription ? `with the following elements: ${userDescription}` : ''}.`;
    await append({
      role: "user",
      content: promptForAI,
    });
  };

  const generateSpeech = useCallback(async (text: string) => {
    if (isGeneratingAudio) return;
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
  }, [isGeneratingAudio]);

  const debouncedGenerateSpeech = useCallback(
    debounce((text: string) => {
      if (text !== lastProcessedMessageRef.current) {
        generateSpeech(text);
        lastProcessedMessageRef.current = text;
      }
    }, 1000),
    [generateSpeech]
  );

  const generateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: generatedPrompt, 
          ...imageParams,
          model: model,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.imageData) {
        setImageUrl(data.imageData);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert(`Failed to generate image: ${error}`);
    }
    setIsGeneratingImage(false);
  };

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        setGeneratedPrompt(lastMessage.content);
        debouncedGenerateSpeech(lastMessage.content);
      }
    }
  }, [messages, debouncedGenerateSpeech]);

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto py-24 px-4">
      <h1 className="text-2xl font-bold mb-4">Stable Diffusion Showcase</h1>
      
      <div className="mb-4">
        <h2 className="text-xl mb-2">Select a Model:</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleModelSelect("sdxl")}
            className={`px-3 py-1 rounded ${
              model === "sdxl" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
            }`}
          >
            SDXL
          </button>
          <button
            onClick={() => handleModelSelect("dreamshaper")}
            className={`px-3 py-1 rounded ${
              model === "dreamshaper" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
            }`}
          >
            Dreamshaper
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl mb-2">Select a Category:</h2>
        <div className="flex flex-wrap gap-2">
          {(model === "sdxl" ? sdxlCategories : dreamshaperCategories).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`px-3 py-1 rounded ${
                category === cat ? "bg-green-500 text-white" : "bg-gray-200 text-black"
              }`}
            >
              {cat}
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
          placeholder="Add details to your image description..."
        />
      </div>

      <button
        onClick={generatePrompt}
        disabled={(!category && !userDescription) || isLoading}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
      >
        Generate Image Prompt
      </button>

      {generatedPrompt && (
        <div className="mb-4">
          <h2 className="text-xl mb-2">Generated Prompt:</h2>
          <p className="p-2 bg-gray-100 rounded">{generatedPrompt}</p>
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
            <option value="896x1152">896x1152</option>
            <option value="1152x896">1152x896</option>
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
        disabled={!generatedPrompt || isGeneratingImage}
        className="bg-purple-500 text-white px-4 py-2 rounded mb-4"
      >
        {isGeneratingImage ? "Generating..." : `Generate Image with ${model === "sdxl" ? "SDXL" : "Dreamshaper"}`}
      </button>

      {isGeneratingImage && <div className="text-center">Generating image...</div>}
      {isGeneratingAudio && <div className="text-center">Generating audio...</div>}

      {imageUrl && (
        <div className="mt-4">
          <h2 className="text-xl mb-2">Generated Image:</h2>
          <img src={imageUrl} alt="Generated image" className="w-full mb-4" />
        </div>
      )}
    </div>
  );
}