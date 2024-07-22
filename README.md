# Encode Club AI Bootcamp Final Project

This project was created as the final project for the encode club AI bootcamp.  I wanted to develop my experience working with Next.js, as well as Typescript.  This project leverages a wide array of functions, from calls to the OpenAI API for chat and TTS Whisper, to using stable diffusion models locally.

The aim of the project is to deepen my understanding and experience with integrating AI models into both the front, and back ends of the build.  It generates image prompts for txt2img incorporating user input.  The prompt is then spoken back to the user while their image is being created.

The user then has basic UI functions to interact with the models.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- Node.js (version 14 or later)
- npm (usually comes with Node.js)
- Git

## Installation

1. Clone the repository:

`git clone https://github.com/giantflyingegg/encodeFinalProject.git`
   
2. Navigate to the project directory:

`cd ai-bootcamp-homework-2-Group1`
   
3. Install the dependencies:

`npm install`
   
## Environment Setup

1. Create a `.env.local` file in the root of your project.

2. Add the following environment variables to the `.env.local` file:

`OPENAI_API_KEY=your_openai_api_key_here`

Replace `your_openai_api_key_here` with your actual OpenAI API key.

## Dependencies

This project uses the following main dependencies:

- Next.js
- React
- OpenAI API
- Vercel AI SDK

These dependencies should be automatically installed when you run `npm install`. If you need to install them manually, you can use the following command:

`npm install next react react-dom openai ai`

## Running the Application

To run the application in development mode:

`npm run dev`


