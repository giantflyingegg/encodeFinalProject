import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt, size, quality, style } = await req.json();

    const response = await openai.images.generate({
      prompt,
      n: 1,
      size: size as "256x256" | "512x512" | "1024x1024",
      quality: quality as "standard" | "hd",
      style: style as "vivid" | "natural",
    });

    return NextResponse.json({ url: response.data[0].url });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json({ error: 'Error generating image' }, { status: 500 });
  }
}