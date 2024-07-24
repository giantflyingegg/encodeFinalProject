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

const samplingAlgorithms = [
  "Euler",
  "Euler a",
  "Heun",
  "DPM++ 2M Karras",
  "DPM++ SDE Karras",
  "DDIM",
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
    steps: 30,
    cfgScale: 7,
    denoisingStrength: 0.7,
    sdxlSampler: "Euler",
    dreamshaperSampler: "Euler",
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
            sampler: imageParams.sdxlSampler,
          }),
        }),
        fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: generatedPrompt,
            ...imageParams,
            model: "dreamshaper",
            sampler: imageParams.dreamshaperSampler,
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
    <div className="flex flex-col w-full max-w-4xl mx-auto py-24 px-4">
      <h1 className="text-2xl font-bold mb-4">Model Comparison: SDXL vs Dreamshaper</h1>

      <div className="mb-4">
        <h2 className="text-xl mb-2">Select a Category:</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded ${
                category === cat ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
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
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl mb-2">Image Generation Parameters:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Size:</label>
            <select
              value={imageParams.size}
              onChange={(e) => setImageParams({ ...imageParams, size: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="1024x1024">1024x1024</option>
              <option value="896x1152">896x1152</option>
              <option value="1152x896">1152x896</option>
            </select>
          </div>
          <div>
            <label className="block mb-2">Quality:</label>
            <select
              value={imageParams.quality}
              onChange={(e) => setImageParams({ ...imageParams, quality: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="standard">Standard</option>
              <option value="hd">HD</option>
            </select>
          </div>
          <div>
            <label className="block mb-2">Style:</label>
            <select
              value={imageParams.style}
              onChange={(e) => setImageParams({ ...imageParams, style: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="vivid">Vivid</option>
              <option value="natural">Natural</option>
            </select>
          </div>
          <div>
            <label className="block mb-2">Steps: {imageParams.steps}</label>
            <input
              type="range"
              min="20"
              max="50"
              value={imageParams.steps}
              onChange={(e) => setImageParams({ ...imageParams, steps: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block mb-2">CFG Scale: {imageParams.cfgScale.toFixed(1)}</label>
            <input
              type="range"
              min="1"
              max="30"
              step="0.1"
              value={imageParams.cfgScale}
              onChange={(e) => setImageParams({ ...imageParams, cfgScale: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block mb-2">Denoising Strength: {imageParams.denoisingStrength.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={imageParams.denoisingStrength}
              onChange={(e) => setImageParams({ ...imageParams, denoisingStrength: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block mb-2">SDXL Sampler:</label>
            <select
              value={imageParams.sdxlSampler}
              onChange={(e) => setImageParams({ ...imageParams, sdxlSampler: e.target.value })}
              className="w-full p-2 border rounded"
            >
              {samplingAlgorithms.map((sampler) => (
                <option key={sampler} value={sampler}>{sampler}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2">Dreamshaper Sampler:</label>
            <select
              value={imageParams.dreamshaperSampler}
              onChange={(e) => setImageParams({ ...imageParams, dreamshaperSampler: e.target.value })}
              className="w-full p-2 border rounded"
            >
              {samplingAlgorithms.map((sampler) => (
                <option key={sampler} value={sampler}>{sampler}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={generateImages}
        disabled={!generatedPrompt || isGenerating}
        className="bg-purple-500 text-white px-4 py-2 rounded mb-4"
      >
        {isGenerating ? "Generating..." : "Generate Images"}
      </button>

      {isGenerating && <div className="text-center">Generating images...</div>}

      {sdxlImage && dreamshaperImage && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-xl mb-2">SDXL Generated Image:</h2>
            <img src={sdxlImage} alt="SDXL generated image" className="w-full" />
          </div>
          <div>
            <h2 className="text-xl mb-2">Dreamshaper Generated Image:</h2>
            <img src={dreamshaperImage} alt="Dreamshaper generated image" className="w-full" />
          </div>
        </div>
      )}
    </div>
  );
}