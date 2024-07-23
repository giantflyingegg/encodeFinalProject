import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

function getSystemMessage(model: string, category: string) {
  const baseMessage = "You are an AI assistant specialized in creating prompts for text-to-image generators. ";
  
  if (model === "sdxl") {
    return baseMessage + `Focus on creating detailed, realistic prompts for the SDXL model, emphasizing ${category}. Include specific details about lighting, composition, and style that SDXL excels at rendering.`;
  } else if (model === "dreamshaper") {
    return baseMessage + `Create imaginative and fantastical prompts for the Dreamshaper model, focusing on ${category}. Emphasize unique and creative elements that showcase Dreamshaper's ability to generate surreal and stylized images.`;
  } else {
    return baseMessage + "Provide detailed descriptions of images based on the given theme and user prompts, including elements, style, details, and colors.";
  }
}

export async function POST(req: Request) {
  const { messages, model, category } = await req.json();

  const systemMessage = getSystemMessage(model, category);

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      { role: 'system', content: systemMessage },
      ...messages,
    ],
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}