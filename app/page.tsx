"use client";

import { useState } from 'react';
import StableDiffusionShowcase from './StableDiffusionShowcase';
import ModelComparison from './ModelComparison';
import Img2ImgComponent from './Img2ImgComponent';

export default function Home() {
  const [activeTab, setActiveTab] = useState('showcase');

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-center mb-4">
        <button
          onClick={() => setActiveTab('showcase')}
          className={`px-4 py-2 mr-2 ${
            activeTab === 'showcase' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Showcase
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2 mr-2 ${
            activeTab === 'comparison' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Model Comparison
        </button>
        <button
          onClick={() => setActiveTab('img2img')}
          className={`px-4 py-2 ${
            activeTab === 'img2img' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Image-to-Image
        </button>
      </div>
      {activeTab === 'showcase' && <StableDiffusionShowcase />}
      {activeTab === 'comparison' && <ModelComparison />}
      {activeTab === 'img2img' && <Img2ImgComponent />}
    </div>
  );
}