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
    <div className="flex flex-col w-full max-w-4xl mx-auto py-8 px-4 bg-dark-blue text-off-white">
      <h1 className="text-3xl font-bold mb-8 text-center text-accent-blue">Stable Diffusion Showcase</h1>
      
      <div className="mb-8 bg-medium-blue p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4 text-accent-blue">Select a Model:</h2>
        <div className="flex gap-4">
          <button
            onClick={() => handleModelSelect("sdxl")}
            className={`px-6 py-2 rounded-full transition-colors duration-200 ${
              model === "sdxl" ? "bg-light-blue text-off-white" : "bg-medium-blue text-accent-blue hover:bg-light-blue hover:text-off-white"
            }`}
          >
            SDXL
          </button>
          <button
            onClick={() => handleModelSelect("dreamshaper")}
            className={`px-6 py-2 rounded-full transition-colors duration-200 ${
              model === "dreamshaper" ? "bg-light-blue text-off-white" : "bg-medium-blue text-accent-blue hover:bg-light-blue hover:text-off-white"
            }`}
          >
            Dreamshaper
          </button>
        </div>
      </div>

      <div className="mb-8 bg-medium-blue p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4 text-accent-blue">Select a Category:</h2>
        <div className="flex flex-wrap gap-3">
          {(model === "sdxl" ? sdxlCategories : dreamshaperCategories).map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
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
          rows={4}
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
          {audioUrl && (
            <div className="mt-4">
              <audio ref={audioRef} controls src={audioUrl} className="w-full" />
            </div>
          )}
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
        onClick={generateImage}
        disabled={!generatedPrompt || isGeneratingImage}
        className={`bg-light-blue text-off-white px-6 py-3 rounded-lg mb-8 transition-colors duration-200 ${
          !generatedPrompt || isGeneratingImage
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-accent-blue"
        }`}
      >
        {isGeneratingImage ? "Generating..." : `Generate Image with ${model === "sdxl" ? "SDXL" : "Dreamshaper"}`}
      </button>

      {isGeneratingImage && <div className="text-center text-accent-blue">Generating image...</div>}
      {isGeneratingAudio && <div className="text-center text-accent-blue">Generating audio...</div>}

      {imageUrl && (
        <div className="mt-8 bg-medium-blue p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl mb-4 text-accent-blue">Generated Image:</h2>
          <img src={imageUrl} alt="Generated image" className="w-full rounded-lg shadow-lg" />
        </div>
      )}
    </div>
  );
}