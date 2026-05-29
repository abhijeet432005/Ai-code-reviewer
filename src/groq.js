import axios from "axios";

const HEADERS = {
  Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
  "Content-Type": "application/json",
};

export async function reviewCode(code) {
  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a senior software engineer doing a thorough code review.

Analyze the code and respond with these exact sections in markdown:

# Bugs
List any bugs, errors, or potential runtime issues. If none, write "No bugs found."

# Improvements
Suggest specific improvements for readability, maintainability, or logic.

# Best Practices
Point out best practice violations and what to do instead.

# Optimized Version
Provide a clean, rewritten version of the code with all fixes applied.

Be specific, concise, and use code blocks where helpful.`,
        },
        { role: "user", content: code },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    },
    { headers: HEADERS }
  );

  return response.data.choices[0].message.content;
}

export async function generateCode(prompt, language = "javascript") {
  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert ${language} developer. 
The user will describe what code they want.
Respond with ONLY the raw code — no explanation, no markdown fences, no backticks.
Write clean, well-commented, production-ready ${language} code.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    },
    { headers: HEADERS }
  );

  return response.data.choices[0].message.content;
}