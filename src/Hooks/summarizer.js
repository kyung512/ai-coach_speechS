export const processSummarizer = async (history) => {
  const summarisePrompt = buildSummarizePrompt(history);
  const summariserPayload = {
    contents: [{ role: 'user', parts: [{ text: summarisePrompt }] }],
    generationConfig: { temperature: 0, maxOutputTokens: 128 },
  };

  const tryExtractJson = (text) => {
  const match = text.match(/\{[\s\S]*?\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (e) {
      console.warn('[summariser] Fallback JSON parse failed');
    }
  }
  return null;
};

  const sumRes = await fetch(`${import.meta.env.VITE_API_URL}/api/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(summariserPayload),
  }).then((r) => r.json());

  const raw = sumRes.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const cleaned = raw
    .replace(/^\s*```json\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let fact;
  try {
    fact = JSON.parse(cleaned);
  } catch (err) {
    console.warn('[summariser] Invalid JSON, raw output:', raw);
    fact = tryExtractJson(raw) || {
      goal: 'none',
      metric: 'none',
      target: 'none',
      deadline: 'none',
      mood: 'none',
    };
  }

  return fact;
};

// Function to build summarizer prompt
const buildSummarizePrompt = (history) =>
  `
    Return JSON only – NO markdown, no code fences, no comments.

    { "goal": "... or none",
      "metric": "... or none",
      "target": "... or none",
      "deadline": "YYYY-MM-DD or none",
      "mood": "... or none" }

    Chat log:
    ${history.map((m) => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}
  `.trim();
