import { GoogleGenAI } from "@google/genai";

/**
 * Generates a concise and appealing task title based on a description.
 * @param description - The full description of the task.
 * @returns A promise that resolves to the suggested title string.
 */
export async function generateTitleFromDescription(description: string): Promise<string> {
    if (!description.trim() || description.length < 10) {
        throw new Error("Description must be at least 10 characters long.");
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the following task description, generate a short, clear, and catchy title of 6 words or less. Do not use quotation marks in the response.

            Description: "${description}"
            
            Title:`,
        });

        return response.text.trim().replace(/"/g, ''); // Clean up any quotes
    } catch (error) {
        console.error("Error generating title with Gemini:", error);
        throw new Error("AI could not suggest a title. Please try again.");
    }
}

/**
 * Improves a task description to be clearer and more professional.
 * @param description - The user-written description of the task.
 * @returns A promise that resolves to the improved description string.
 */
export async function improveTaskDescription(description: string): Promise<string> {
    if (!description.trim() || description.length < 10) {
        throw new Error("Description must be at least 10 characters long.");
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are a helpful assistant for a task marketplace app. Your goal is to make task descriptions clear, concise, and appealing to potential workers ("Marshals").
            
            Rewrite the following task description. Keep the core information but improve the clarity, grammar, and tone. Format the output as a single paragraph without any introductory phrases like "Here's the improved description:".

            Original Description: "${description}"
            
            Improved Description:`,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error improving description with Gemini:", error);
        throw new Error("AI could not improve the description. Please try again.");
    }
}
