/**
 * Editor pass.
 *
 * Takes a first-draft post and asks the same LLM (or optionally a different
 * one) to act as an editor: identify weak sentences, AI-isms, vague claims,
 * and missed opportunities — then rewrite. Returns the revised post in the
 * same JSON schema the draft used.
 *
 * Two useful gains from this over single-pass:
 *   1. AI-ism pass — LLMs obey a banned-phrase list only 80-90% of the
 *      first time. Reading their own draft with the banlist in hand, they
 *      catch the slips.
 *   2. Specificity injection — the editor is told to find any paragraph
 *      that could be true of any story, and replace it with something
 *      that's specifically true of THIS story.
 *
 * Opt in with EDITORIAL_PASSES=2 (default is 1).
 */

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Headline } from './rss';
import {
  type GeneratedPost,
  parseEditorialJson,
  pickAuthor,
  slugify,
} from './editorial-prompt';
import { CATEGORIES, SITE } from '../../lib/site';

const EDITOR_SYSTEM = `You are the senior editor at ${SITE.name}, a website that warns everyday people about scams in plain English.

You will be given: the source story, and a first-draft scam alert. Your job is to RETURN A CLEARER, MORE ACCURATE, MORE USEFUL VERSION OF THAT DRAFT.

What to do in order:

1. Check facts against the source:
   - Remove any number, money amount, victim story, quote, date, phone number or website address that is NOT in the source article.
   - Remove any real scammer link, phone number or crypto wallet — describe it instead.
   - If the source names the company being impersonated or what the scammer asks for and the draft is vague, use the specific detail.

2. Make it easier to read:
   - Replace jargon with plain words, or explain it briefly the first time.
   - Split long sentences. Aim for a 12-year-old's reading level.
   - Turn vague warnings ("stay vigilant") into concrete actions ("hang up and call the number on the back of your card").
   - Remove filler words (crucial, vital, essential, robust, seamless, unprecedented, pivotal) and phrases like "In today's digital world", "It is important to note", "In conclusion", "deep dive".
   - Remove scare language and ALL CAPS.

3. Check the structure: what is happening → what it looks like → red flags (list) → how to protect yourself → what to do if you have already responded. No "Conclusion" section.

4. Preserve the JSON schema and the category (it must be one of: ${CATEGORIES.join(', ')}).

5. Word count stays 700-1000. Don't pad to hit a number.

Return STRICT JSON matching the input schema EXACTLY:
{
  "title": "...",
  "excerpt": "...",
  "category": "...",
  "readTime": integer,
  "content": "...",
  "imagePrompt": "..."
}

Do not return commentary. Do not wrap in markdown fences. Just the revised JSON.`;

interface EditorInputs {
  headline: Headline;
  articleBody: string | null;
  draft: Omit<GeneratedPost, 'slug' | 'author'>;
}

function buildEditorUserPrompt(inputs: EditorInputs): string {
  const { headline, articleBody, draft } = inputs;
  const src = articleBody
    ? `ARTICLE BODY (the writer's source of truth):
---
${articleBody}
---`
    : 'ARTICLE BODY: unavailable — use headline + snippet only.';

  return `HEADLINE: ${headline.title}
SOURCE: ${headline.source}
SNIPPET: ${headline.contentSnippet ?? '(none)'}

${src}

FIRST DRAFT (revise this, same JSON schema):
${JSON.stringify(draft, null, 2)}

Return ONLY the revised JSON.`;
}

async function reviseWithGroq(
  inputs: EditorInputs,
): Promise<Omit<GeneratedPost, 'slug' | 'author'>> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set.');
  const client = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const completion = await client.chat.completions.create({
    model,
    // Slightly lower temperature than the draft pass — we want the editor
    // to be disciplined, not inventive.
    temperature: 0.55,
    top_p: 0.9,
    response_format: { type: 'json_object' },
    max_tokens: 4096,
    messages: [
      { role: 'system', content: EDITOR_SYSTEM },
      { role: 'user', content: buildEditorUserPrompt(inputs) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '';
  if (!raw) throw new Error('Groq editor returned empty response.');
  return parseEditorialJson(raw);
}

async function reviseWithGemini(
  inputs: EditorInputs,
): Promise<Omit<GeneratedPost, 'slug' | 'author'>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set.');
  const genai = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const model = genai.getGenerativeModel({
    model: modelName,
    systemInstruction: EDITOR_SYSTEM,
    generationConfig: {
      temperature: 0.55,
      topP: 0.9,
      responseMimeType: 'application/json',
    },
  });
  const result = await model.generateContent(buildEditorUserPrompt(inputs));
  return parseEditorialJson(result.response.text());
}

/**
 * Run an editor pass on a draft. On any failure, the ORIGINAL draft is
 * returned — a bad revision is worse than no revision.
 *
 *   EDITOR_PROVIDER=groq    (default if GROQ_API_KEY set)
 *   EDITOR_PROVIDER=gemini
 *   EDITOR_PROVIDER=cross   (use Gemini to edit a Groq draft, or vice versa)
 *                           — requested via pipeline, not env alone.
 *
 * @param draftProvider the provider that wrote the draft, for 'cross' mode
 */
export async function editorPass(
  inputs: EditorInputs,
  draftProvider: 'groq' | 'gemini',
): Promise<{
  post: Omit<GeneratedPost, 'slug' | 'author'>;
  revised: boolean;
  editor: 'groq' | 'gemini' | null;
}> {
  const mode = (process.env.EDITOR_PROVIDER || '').toLowerCase();
  // Pick editor: explicit env, else cross (opposite of drafter), else
  // same-as-drafter.
  let editor: 'groq' | 'gemini' | null;
  if (mode === 'groq') editor = 'groq';
  else if (mode === 'gemini') editor = 'gemini';
  else if (mode === 'cross') editor = draftProvider === 'groq' ? 'gemini' : 'groq';
  else editor = draftProvider; // same-LLM (default)

  try {
    const revised =
      editor === 'groq' ? await reviseWithGroq(inputs) : await reviseWithGemini(inputs);
    return { post: revised, revised: true, editor };
  } catch (err) {
    console.warn(
      `[editor] ${editor} editor pass failed: ${(err as Error).message}. Keeping original draft.`,
    );
    return { post: inputs.draft, revised: false, editor: null };
  }
}

export function attachIdentity(
  base: Omit<GeneratedPost, 'slug' | 'author'>,
): GeneratedPost {
  return {
    ...base,
    author: pickAuthor(),
    slug: slugify(base.title) || `post-${Date.now()}`,
  };
}
