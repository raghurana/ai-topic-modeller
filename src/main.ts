import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const main = async () => {
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: "You are a friendly assistant!",
    prompt: "Why is the sky blue?",
  });

  console.log(text);
};

main()
  .catch(console.error)
  .finally(() => {
    console.log("\n\nProgram finished !!");
  });
