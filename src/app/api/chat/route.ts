import { streamText, tool } from "ai";
import { z } from "zod";
import { createAnthropic } from "@ai-sdk/anthropic";
import { LanguageModel } from "ai";

const MODEL = "claude-3-5-sonnet-20240620";

const anthropic = createAnthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export function getModel(model?: string): LanguageModel {
  return anthropic(model ?? MODEL);
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: anthropic("claude-3-5-sonnet-20240620"),
    tools: {
      weather: tool({
        description: "Get the weather in a location",
        parameters: z.object({
          location: z.string().describe("The location to get the weather for"),
        }),
        execute: async ({ location }) => {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`
          );
          const data = await response.json();
          console.log(data);
          return {
            location,
            temperature: 72 + Math.floor(Math.random() * 21) - 10,
          };
        },
      }),
    },
    maxToolRoundtrips: 5, // allow up to 5 tool roundtrips
    system:
      "You are a helpful assistant that can answer questions and help with tasks.",
    messages,
  });

  return result.toDataStreamResponse();
}
