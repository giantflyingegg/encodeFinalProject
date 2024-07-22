import { NextResponse } from 'next/server';

const SD_API_URL = 'http://127.0.0.1:7860/sdapi/v1/txt2img';

export async function POST(req: Request) {
  console.log('Received request to generate image');
  try {
    const { prompt, size, quality, style } = await req.json();
    console.log('Request parameters:', { prompt, size, quality, style });

    // Convert size to width and height
    const [width, height] = size.split('x').map(Number);

    // Map quality and style to SD parameters
    const steps = quality === 'hd' ? 50 : 30;
    const cfg_scale = style === 'vivid' ? 7.5 : 7.0;

    // First, fetch available samplers
    console.log('Fetching available samplers...');
    const samplersResponse = await fetch(`${SD_API_URL.replace('txt2img', 'samplers')}`);
    if (!samplersResponse.ok) {
      throw new Error(`Failed to fetch samplers: ${samplersResponse.statusText}`);
    }
    const samplers = await samplersResponse.json();
    console.log('Available samplers:', samplers);

    // Choose the first available sampler
    const sampler_name = samplers[0]?.name || 'Euler a';
    console.log('Selected sampler:', sampler_name);

    const requestBody = JSON.stringify({
      prompt: prompt,
      negative_prompt: '',
      width: width,
      height: height,
      steps: steps,
      cfg_scale: cfg_scale,
      sampler_name: sampler_name,
      batch_size: 1,
      n_iter: 1,
      seed: -1,
    });

    console.log('Sending request to Stable Diffusion API...');
    console.log('Request body:', requestBody);

    const response = await fetch(SD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    console.log('Received response from Stable Diffusion API');
    console.log('Response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('API responded with error. Response text:', responseText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
    }

    const data = await response.json();
    console.log('Successfully parsed response JSON');

    if (!data.images || data.images.length === 0) {
      console.error('No image data in the response');
      throw new Error('No image generated');
    }

    // The image is returned as a base64 string
    const imageBase64 = data.images[0];
    console.log('Successfully extracted image data');

    // Send the base64 string directly
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