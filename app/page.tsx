"use client";

import { useState } from 'react';
import StableDiffusionShowcase from './StableDiffusionShowcase';
import ModelComparison from './ModelComparison';

export default function Home() {
  const [activeTab, setActiveTab] = useState('showcase');

  return (
    <div className="min-h-screen bg-dark-blue text-off-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-accent-blue">Stable Diffusion Image Generator</h1>
        
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setActiveTab('showcase')}
            className={`px-6 py-3 mr-4 rounded-lg transition-colors duration-200 ${
              activeTab === 'showcase' 
                ? 'bg-light-blue text-off-white' 
                : 'bg-medium-blue text-accent-blue hover:bg-light-blue hover:text-off-white'
            }`}
          >
            Showcase
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-6 py-3 rounded-lg transition-colors duration-200 ${
              activeTab === 'comparison' 
                ? 'bg-light-blue text-off-white' 
                : 'bg-medium-blue text-accent-blue hover:bg-light-blue hover:text-off-white'
            }`}
          >
            Model Comparison
          </button>
        </div>

        <div className="bg-medium-blue rounded-lg shadow-lg p-6">
          {activeTab === 'showcase' ? <StableDiffusionShowcase /> : <ModelComparison />}
        </div>
      </div>
    </div>
  );
}