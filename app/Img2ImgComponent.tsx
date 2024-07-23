import React, { useState, useEffect } from 'react';
import { useChat } from 'ai/react';

const models = ['sdxl', 'dreamshaper'];

export default function Img2ImgComponent() {
  const [sourceModel, setSourceModel] = useState('sdxl');
  const [targetModel, setTargetModel] = useState('dreamshaper');
  const [imageUrl, setImageUrl] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [sourceImage, setSourceImage] = useState('');
  const [targetImage, setTargetImage] = useState('');
  const [isGeneratingSource, setIsGeneratingSource] = useState(false);
  const [isGeneratingTarget, setIsGeneratingTarget] = useState(false);
  const [imageParams, setImageParams] = useState({
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
  });

  const { messages, append, isLoading } = useChat({
    api: '/api/chat',
  });

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        setGeneratedPrompt(lastMessage.content);
      }
    }
  }, [messages]);

  const generatePrompt = async () => {
    if (!userPrompt) return;
    const promptForAI = `Generate a detailed prompt for image generation based on the following description: ${userPrompt}. The prompt should be suitable for both SDXL and Dreamshaper models.`;
    await append({
      role: 'user',
      content: promptForAI,
    });
  };

  const generateSourceImage = async () => {
    setIsGeneratingSource(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: generatedPrompt,
          ...imageParams,
          model: sourceModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate source image');
      }

      const data = await response.json();
      setSourceImage(data.imageData);
    } catch (error) {
      console.error('Error generating source image:', error);
      alert(`Failed to generate source image: ${error}`);
    }
    setIsGeneratingSource(false);
  };

  const generateTargetImage = async () => {
    setIsGeneratingTarget(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: generatedPrompt,
          ...imageParams,
          model: targetModel,
          initImage: sourceImage || imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate target image');
      }

      const data = await response.json();
      setTargetImage(data.imageData);
    } catch (error) {
      console.error('Error generating target image:', error);
      alert(`Failed to generate target image: ${error}`);
    }
    setIsGeneratingTarget(false);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto py-24 px-4">
      <h1 className="text-2xl font-bold mb-4">Image-to-Image Generation</h1>

      <div className="mb-4">
        <h2 className="text-xl mb-2">Source Image</h2>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Enter image URL or generate new image"
          className="w-full p-2 border rounded mb-2"
        />
        <div className="flex gap-2 mb-2">
          {models.map((model) => (
            <button
              key={model}
              onClick={() => setSourceModel(model)}
              className={`px-3 py-1 rounded ${
                sourceModel === model ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
              }`}
            >
              {model}
            </button>
          ))}
        </div>
        <textarea
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          className="w-full p-2 border rounded"
          rows={3}
          placeholder="Describe your image..."
        />
      </div>

      <button
        onClick={generatePrompt}
        disabled={!userPrompt || isLoading}
        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
      >
        Generate Prompt
      </button>

      {generatedPrompt && (
        <div className="mb-4">
          <h2 className="text-xl mb-2">Generated Prompt:</h2>
          <p className="p-2 bg-gray-100 rounded">{generatedPrompt}</p>
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
        onClick={generateSourceImage}
        disabled={!generatedPrompt || isGeneratingSource}
        className="bg-purple-500 text-white px-4 py-2 rounded mb-4"
      >
        {isGeneratingSource ? 'Generating...' : `Generate Source Image with ${sourceModel}`}
      </button>

      {(sourceImage || imageUrl) && (
        <div className="mb-4">
          <h2 className="text-xl mb-2">Source Image:</h2>
          <img src={sourceImage || imageUrl} alt="Source" className="w-full mb-4" />

          <h2 className="text-xl mb-2">Target Model</h2>
          <div className="flex gap-2 mb-2">
            {models
              .filter((model) => model !== sourceModel)
              .map((model) => (
                <button
                  key={model}
                  onClick={() => setTargetModel(model)}
                  className={`px-3 py-1 rounded ${
                    targetModel === model ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
                  }`}
                >
                  {model}
                </button>
              ))}
          </div>

          <button
            onClick={generateTargetImage}
            disabled={isGeneratingTarget}
            className="bg-indigo-500 text-white px-4 py-2 rounded mb-4"
          >
            {isGeneratingTarget ? 'Generating...' : `Generate Target Image with ${targetModel}`}
          </button>
        </div>
      )}

      {targetImage && (
        <div className="mb-4">
          <h2 className="text-xl mb-2">Target Image:</h2>
          <img src={targetImage} alt="Target" className="w-full" />
        </div>
      )}
    </div>
  );
}