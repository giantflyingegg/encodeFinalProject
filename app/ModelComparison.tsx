import { useState, useEffect, useCallback } from "react";
import { useChat } from "ai/react";

const categories = [
  "Landscapes",
  "Portraits",
  "Sci-Fi Scenes",
  "Abstract Art",
  "Character Designs",
];

interface ImageParams {
  size: string;
  steps: number;
  cfg_scale: number;
  sampler: string;
}

const defaultImageParams: ImageParams = {
  size: "1024x1024",
  steps: 30,
  cfg_scale: 7.5,
  sampler: "DPM++ 2M Karras",
};

const samplers = [
  "DPM++ 2M Karras",
  "Euler a",
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
  const [sdxlParams, setSdxlParams] = useState<ImageParams>({ ...defaultImageParams });
  const [dreamshaperParams, setDreamshaperParams] = useState<ImageParams>({ ...defaultImageParams });

  const { messages, append, isLoading } = useChat({
    api: "/api/chat",
    body: { category },
  });

  const generatePrompt = async () => {
    if (!category && !userDescription) return;
    const promptForAI = `Generate a detailed prompt of less than 100 words for image generation of a ${category} ${
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
            ...sdxlParams,
            model: "sdxl",
          }),
        }),
        fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: generatedPrompt,
            ...dreamshaperParams,
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

  const renderModelControls = (model: "sdxl" | "dreamshaper") => {
    const params = model === "sdxl" ? sdxlParams : dreamshaperParams;
    const setParams = model === "sdxl" ? setSdxlParams : setDreamshaperParams;

    return (
      <div className="mb-4">
        <h3 className="text-xl mb-2 text-creamy-off-white">{model === "sdxl" ? "SDXL" : "Dreamshaper"} Parameters:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-creamy-off-white mb-1">Image Size</label>
            <select
              value={params.size}
              onChange={(e) => setParams({ ...params, size: e.target.value })}
              className="w-full p-3 bg-medium-blue text-off-white border border-light-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
            >
              <option value="1024x1024">1024x1024</option>
              <option value="896x1152">896x1152</option>
              <option value="1152x896">1152x896</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-creamy-off-white mb-1">Steps</label>
            <input
              type="number"
              value={params.steps}
              onChange={(e) => setParams({ ...params, steps: parseInt(e.target.value) })}
              min={1}
              max={150}
              className="w-full p-3 bg-medium-blue text-off-white border border-light-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
              placeholder="Steps"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-creamy-off-white mb-1">CFG Scale</label>
            <input
              type="number"
              value={params.cfg_scale}
              onChange={(e) => setParams({ ...params, cfg_scale: parseFloat(e.target.value) })}
              min={1}
              max={30}
              step={0.1}
              className="w-full p-3 bg-medium-blue text-off-white border border-light-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
              placeholder="CFG Scale"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-creamy-off-white mb-1">Sampler</label>
            <select
              value={params.sampler}
              onChange={(e) => setParams({ ...params, sampler: e.target.value })}
              className="w-full p-3 bg-medium-blue text-off-white border border-light-blue rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue"
            >
              {samplers.map((sampler) => (
                <option key={sampler} value={sampler}>{sampler}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto py-8 px-4 bg-dark-blue text-off-white">
      <h1 className="text-3xl font-bold mb-8 text-center text-yellowy-white">Model Comparison: SDXL vs Dreamshaper</h1>

      <div className="mb-8 bg-medium-blue p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4 text-creamy-off-white">Select a Category:</h2>
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
        <h2 className="text-2xl mb-4 text-creamy-off-white">Your Description:</h2>
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
          <h2 className="text-2xl mb-4 text-creamy-off-white">Generated Prompt:</h2>
          <p className="p-3 bg-medium-blue rounded-lg">{generatedPrompt}</p>
        </div>
      )}

      <div className="mb-8 bg-medium-blue p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4 text-creamy-off-white">Image Generation Parameters:</h2>
        {renderModelControls("sdxl")}
        {renderModelControls("dreamshaper")}
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
            <h2 className="text-2xl mb-4 text-creamy-off-white">SDXL Generated Image:</h2>
            <img src={sdxlImage} alt="SDXL generated image" className="w-full rounded-lg shadow-lg" />
          </div>
          <div className="bg-medium-blue p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl mb-4 text-creamy-off-white">Dreamshaper Generated Image:</h2>
            <img src={dreamshaperImage} alt="Dreamshaper generated image" className="w-full rounded-lg shadow-lg" />
          </div>
        </div>
      )}
    </div>
  );
}