import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_LESSONS } from '@/constants/lessonData/index';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkedExample {
  problem: string;
  steps: string[];
  answer: string;
}

export interface PracticeProblem {
  question: string;
  hint: string;
  steps: string[];
  answer: string;
}

export interface LessonContent {
  topicTitle: string;
  courseTitle: string;
  introduction: string;
  keyConcepts: string[];
  keyFormulas: string[];
  workedExamples: WorkedExample[];
  practiceProblems: PracticeProblem[];
  summary: string;
}

// Cache key for AI-generated premium lessons (static lessons need no cache)
const AI_CACHE_PREFIX = '@math_helper_ai_lesson_v1_';

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Returns a lesson for the given topic.
 * 1. Checks the bundled static lesson library (instant, no network)
 * 2. Falls back to AsyncStorage cache (previously AI-generated)
 * 3. Falls back to AI generation (premium — requires API key)
 */
export async function getLesson(
  courseId: string,
  topicId: string,
  topicTitle: string,
  courseTitle: string
): Promise<LessonContent> {
  const key = `${courseId}_${topicId}`;

  // 1. Bundled static lesson — instant
  const staticLesson = (ALL_LESSONS as Record<string, LessonContent>)[key];
  if (staticLesson) return staticLesson;

  // 2. Previously AI-generated lesson (cached)
  try {
    const cached = await AsyncStorage.getItem(`${AI_CACHE_PREFIX}${key}`);
    if (cached) return JSON.parse(cached) as LessonContent;
  } catch {
    // ignore cache read errors
  }

  // 3. AI generation (premium fallback)
  const lesson = await generateLesson(topicTitle, courseTitle);
  try {
    await AsyncStorage.setItem(`${AI_CACHE_PREFIX}${key}`, JSON.stringify(lesson));
  } catch {
    // ignore cache write errors
  }
  return lesson;
}

// ─── AI Generation (premium / fallback) ──────────────────────────────────────

import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

async function generateLesson(
  topicTitle: string,
  courseTitle: string
): Promise<LessonContent> {
  const prompt = `You are an expert math tutor. Create a comprehensive lesson.

Topic: "${topicTitle}"
Course: "${courseTitle}"

Return ONLY valid JSON — no markdown fences — matching this exact structure:
{
  "topicTitle": "${topicTitle}",
  "courseTitle": "${courseTitle}",
  "introduction": "2-sentence overview",
  "keyConcepts": ["Concept 1", "Concept 2", "Concept 3", "Concept 4"],
  "keyFormulas": ["$$formula1$$", "$$formula2$$"],
  "workedExamples": [
    { "problem": "...", "steps": ["Step 1", "Step 2", "Step 3", "Step 4"], "answer": "..." },
    { "problem": "...", "steps": ["Step 1", "Step 2", "Step 3"], "answer": "..." }
  ],
  "practiceProblems": [
    { "question": "...", "hint": "...", "steps": ["Step 1", "Step 2", "Step 3"], "answer": "..." },
    { "question": "...", "hint": "...", "steps": ["Step 1", "Step 2", "Step 3"], "answer": "..." },
    { "question": "...", "hint": "...", "steps": ["Step 1", "Step 2", "Step 3", "Step 4"], "answer": "..." }
  ],
  "summary": "1-2 sentence key takeaway."
}

Rules: Use $...$ for inline math, $$...$$ for display equations. Return ONLY the JSON.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });

  const raw = response.choices[0].message.content ?? '';
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/g, '')
    .trim();

  return JSON.parse(cleaned) as LessonContent;
}
