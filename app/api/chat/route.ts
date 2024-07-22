import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'You are an AI assistant specialized in creating prompts for text to image generators. Provide detailed descriptions of paintings based on the given theme and user prompts, including elements, style, details, and colors. Keep your responses concise and within 200 tokens.',
      },
      ...messages,
    ],
    max_tokens: 200,  // This limits the response to about 150-200 words
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}