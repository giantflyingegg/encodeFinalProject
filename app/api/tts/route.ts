import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: Request) {
  const { text } = await req.json();

  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });

    // Convert the audio buffer to a Blob
    const audioBlob = new Blob([await mp3.arrayBuffer()], { type: 'audio/mpeg' });

    // Create a response with the audio data
    return new NextResponse(audioBlob, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Error generating TTS:', error);
    return NextResponse.json({ error: 'Error generating TTS' }, { status: 500 });
  }
}