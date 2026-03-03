const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ── Detect Language ──────────────────────────────────────────────────────────
export const detectLanguage = async (text) => {
  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 20,
        messages: [{
          role: 'user',
          content: `Detect the language of this text and reply with ONLY the language name in English. Nothing else. Text: "${text}"`,
        }],
      }),
    });
    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || 'English';
  } catch {
    return 'English';
  }
};

// ── Send Message + Typewriter + Real-time Word Callback ──────────────────────
// onChunk(displayedText)   → update UI with growing text
// onDone(fullText)         → called when streaming complete
// onWord(word, index)      → called for EACH word — use this for real-time TTS
// shouldStop()             → return true to abort mid-stream
export const sendMessageStream = async (
  messages,
  detectedLanguage = 'English',
  onChunk,
  onDone,
  onWord = null,
  shouldStop = () => false
) => {
  const systemPrompt = `You are a helpful AI assistant. Always reply in ${detectedLanguage}. Be concise and friendly.`;

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.text,
    })),
  ];

  // Fetch full response
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: formattedMessages,
      max_tokens: 1024,
    }),
  });

  const data = await response.json();

  if (!data?.choices?.[0]?.message?.content) {
    throw new Error(data?.error?.message || 'No response from AI');
  }

  const fullText = data.choices[0].message.content;
  const words = fullText.split(' ');
  let displayed = '';

  // Typewriter effect + per-word callback
  await new Promise((resolve) => {
    let index = 0;
    const interval = setInterval(() => {
      if (shouldStop()) { clearInterval(interval); resolve(); return; }
      if (index >= words.length) { clearInterval(interval); resolve(); return; }

      const word = words[index];
      displayed += (index === 0 ? '' : ' ') + word;

      onChunk(displayed);           // Update UI text
      if (onWord) onWord(word);     // 🔊 Speak this word

      index++;
    }, 80); // 80ms per word — syncs well with TTS
  });

  onDone(fullText);
};