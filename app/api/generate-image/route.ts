import { NextResponse } from 'next/server';

const SD_API_URL = 'http://127.0.0.1:7860/sdapi/v1';

async function fetchAvailableSamplers() {
  const response = await fetch(`${SD_API_URL}/samplers`);
  if (!response.ok) {
    throw new Error(`Failed to fetch samplers: ${response.statusText}`);
  }
  return await response.json();
}

async function generateImage(endpoint: string, params: any) {
  // Fetch available samplers
  const samplers = await fetchAvailableSamplers();
  console.log('Available samplers:', samplers.map((s: any) => s.name));

  // Check if the specified sampler is available, otherwise use a default
  const defaultSampler = 'Euler a';
  if (!samplers.some((s: any) => s.name === params.sampler_name)) {
    console.log(`Sampler "${params.sampler_name}" not found. Using default: ${defaultSampler}`);
    params.sampler_name = defaultSampler;
  }

  const response = await fetch(`${SD_API_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);
  }

  return await response.json();
}

export async function POST(req: Request) {
  console.log('Received request to generate image');
  try {
    const { prompt, size, quality, style, model } = await req.json();
    console.log('Request parameters:', { prompt, size, quality, style, model });

    const [width, height] = size.split('x').map(Number);
    const steps = quality === 'hd' ? 50 : 30;
    const cfg_scale = style === 'vivid' ? 7.5 : 7.0;

    let params: any = {
      prompt: prompt,
      negative_prompt: '',
      width: width,
      height: height,
      steps: steps,
      cfg_scale: cfg_scale,
      sampler_name: 'DPM++ 2M Karras',
      batch_size: 1,
      n_iter: 1,
      seed: -1,
    };

    if (model === 'sdxl') {
      params.override_settings = {
        sd_model_checkpoint: 'sd_xl_base_1.0.safetensors' // Adjust this to your SDXL model filename
      };
    } else if (model === 'dreamshaper') {
      params.override_settings = {
        sd_model_checkpoint: 'dreamshaper_8.safetensors' // Adjust this to your Dreamshaper model filename
      };
    } else {
      throw new Error('Invalid model specified');
    }

    console.log(`Generating image with ${model.toUpperCase()}...`);
    const result = await generateImage('txt2img', params);
    
    if (!result.images || result.images.length === 0) {
      throw new Error('No image generated');
    }

    const imageBase64 = result.images[0];
    console.log('Successfully generated image');

    return NextResponse.json({ imageData: `data:image/png;base64,${imageBase64}` });

  } catch (error) {
    console.error('Error in image generation:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: `Error generating image: ${error.message}` }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
}