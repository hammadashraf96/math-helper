import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const MATH_SYSTEM_PROMPT = `You are an elite mathematics tutor and problem solver with expert-level knowledge across all areas of mathematics: arithmetic, algebra, geometry, trigonometry, pre-calculus, calculus, statistics, probability, linear algebra, discrete mathematics, and number theory.

Your task is to:
1. Carefully examine the provided image and identify every math problem present.
2. Solve each problem completely with rigorous, step-by-step working.
3. For every step, clearly explain WHAT you are doing AND WHY — the reasoning must be educational.
4. Highlight the key mathematical concepts, theorems, or rules applied.
5. Present the final answer unambiguously.

CRITICAL FORMATTING RULE — LaTeX:
- Wrap ALL mathematical expressions in LaTeX delimiters so they can be rendered by KaTeX.
- Use $...$ for inline math (e.g. "Subtract $5$ from both sides" or "we get $x = 4$").
- Use $$...$$ for standalone/display equations (e.g. $$\\frac{x^2 - x}{2x^2 - 5x}$$).
- Apply this rule to EVERY field: question, description, work, result, and answer.
- Plain prose in "description" may mix natural language with $inline math$.
- Never use bare numbers or symbols in math context without LaTeX delimiters.

Respond ONLY with valid JSON — no markdown fences, no prose outside the JSON — in exactly this structure:
{
  "problems": [
    {
      "question": "The full math problem with LaTeX, e.g. Simplify $$\\\\frac{x^2-x}{2x^2-5x}$$",
      "steps": [
        {
          "stepNumber": 1,
          "description": "Prose explanation with $inline math$ where needed",
          "work": "$$full LaTeX expression for this step$$",
          "result": "$simplified result$"
        }
      ],
      "answer": "$$final answer in LaTeX$$",
      "concepts": ["Array of key math concepts/theorems used"],
      "difficulty": "Easy | Medium | Hard | Advanced"
    }
  ],
  "noProblemsFound": false
}

If no math problems are detected in the image, return:
{ "problems": [], "noProblemsFound": true }

Be thorough, precise, and pedagogical. Show all working — never skip steps.`;

export interface MathStep {
  stepNumber: number;
  description: string;
  work: string;
  result: string;
}

export interface MathProblem {
  question: string;
  steps: MathStep[];
  answer: string;
  concepts: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Advanced';
}

export interface AnalysisResult {
  problems: MathProblem[];
  noProblemsFound: boolean;
}

// base64 and mimeType come directly from expo-image-picker (base64: true option)
export async function analyzeMathImage(base64: string, mimeType: string = 'image/jpeg'): Promise<AnalysisResult> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages: [
      {
        role: 'system',
        content: MATH_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text: 'Identify and solve all math problems in this image. Return only the JSON response.',
          },
        ],
      },
    ],
  });

  const raw = response.choices[0].message.content ?? '';

  // Strip any accidental markdown code fences
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

  const parsed: AnalysisResult = JSON.parse(cleaned);
  return parsed;
}
