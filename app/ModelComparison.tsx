"use client";

import { useState, useEffect, useCallback } from "react";
import { useChat } from "ai/react";

const categories = [
  "Landscapes",
  "Portraits",
  "Sci-Fi Scenes",
  "Abstract Art",
  "Character Designs",
];

export default function ModelComparison() {
  const [category, setCategory] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [sdxlImage, setSdxlImage] = useState("");
  const [dreamshaperImage, setDreamshaperImage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageParams, setImageParams] = useState({
    size: "1024x1024",
    quality: "standard",
    style: "vivid",
  });

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    body: { category },
  });

  const generatePrompt = async () => {
    if (!category && !userDescription) return;
    const promptForAI = `Generate a detailed prompt for image generation of a ${category} ${
      userDescription ? `with the following elements: ${userDescription}` : ""
    }. The prompt should be suitable for both SDXL and Dreamshaper models.`;
    await append({
      role: "user",
      content: promptForAI,
    });
  };

  const generateImages = async () => {
    setIsGenerating(true);
    try {
      const [sdxlResponse, dreamshaperResponse] = await Promise.all([
        fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: generatedPrompt,
            ...imageParams,
            model: "sdxl",
          }),
        }),
        fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: generatedPrompt,
            ...imageParams,
            model: "dreamshaper",
          }),
        }),
      ]);

      if (!sdxlResponse.ok || !dreamshaperResponse.ok) {
        throw new Error("One or both image generation requests failed");
      }

      const sdxlData = await sdxlResponse.json();
      const dreamshaperData = await dreamshaperResponse.json();

      setSdxlImage(sdxlData.imageData);
      setDreamshaperImage(dreamshaperData.imageData);
    } catch (error) {
      console.error("Error generating images:", error);
      alert(`Failed to generate images: ${error}`);
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        setGeneratedPrompt(lastMessage.content);
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto py-8 px-4 bg-dark-blue text-off-white">
      <h1 className="text-3xl font-bold mb-8 text-center text-accent-blue">Model Comparison: SDXL vs Dreamshaper</h1>

      <div className="mb-8 bg-medium-blue p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4 text-accent-blue">Select a Category:</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm transition-colors duration-200 ${
                category === cat ? "bg-light-blue text-off-white" : "bg-medium-blue text-accent-blue hover:bg-light-blue hover:text-off-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 bg-medium-blue p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4 text-accent-blue">Your Description:</h2>
        <textarea
          value={userDescription}
          onChange={(e) => setUserDescription(e.target.value)}
          className="w-full p-3 bg-medium-blue text-off-white border border-light-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
          rows={3}
          placeholder="Add details to your image description..."
        />
      </div>

      <button
        onClick={generatePrompt}
        disabled={(!category && !userDescription) || isLoading}
        className={`bg-light-blue text-off-white px-6 py-3 rounded-lg mb-8 transition-colors duration-200 ${
          (!category && !userDescription) || isLoading
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-accent-blue"
        }`}
      >
        Generate Image Prompt
      </button>

      {generatedPrompt && (
        <div className="mb-8 bg-medium-blue p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl mb-4 text-accent-blue">Generated Prompt:</h2>
          <p className="p-3 bg-medium-blue rounded-lg">{generatedPrompt}</p>
        </div>
      )}

      <div className="mb-8 bg-medium-blue p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4 text-accent-blue">Image Generation Parameters:</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={imageParams.size}
            onChange={(e) => setImageParams({ ...imageParams, size: e.target.value })}
            className="p-3 bg-medium-blue text-off-white border border-light-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="1024x1024">1024x1024</option>
            <option value="896x1152">896x1152</option>
            <option value="1152x896">1152x896</option>
          </select>
          <select
            value={imageParams.quality}
            onChange={(e) => setImageParams({ ...imageParams, quality: e.target.value })}
            className="p-3 bg-medium-blue text-off-white border border-light-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="standard">Standard</option>
            <option value="hd">HD</option>
          </select>
          <select
            value={imageParams.style}
            onChange={(e) => setImageParams({ ...imageParams, style: e.target.value })}
            className="p-3 bg-medium-blue text-off-white border border-light-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="vivid">Vivid</option>
            <option value="natural">Natural</option>
          </select>
        </div>
      </div>

      <button
        onClick={generateImages}
        disabled={!generatedPrompt || isGenerating}
        className={`bg-light-blue text-off-white px-6 py-3 rounded-lg mb-8 transition-colors duration-200 ${
          !generatedPrompt || isGenerating
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-accent-blue"
        }`}
      >
        {isGenerating ? "Generating..." : "Generate Images"}
      </button>

      {isGenerating && <div className="text-center text-accent-blue">Generating images...</div>}

      {sdxlImage && dreamshaperImage && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-medium-blue p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl mb-4 text-accent-blue">SDXL Generated Image:</h2>
            <img src={sdxlImage} alt="SDXL generated image" className="w-full rounded-lg shadow-lg" />
          </div>
          <div className="bg-medium-blue p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl mb-4 text-accent-blue">Dreamshaper Generated Image:</h2>
            <img src={dreamshaperImage} alt="Dreamshaper generated image" className="w-full rounded-lg shadow-lg" />
          </div>
        </div>
      )}
    </div>
  );
}