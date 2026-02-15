import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSql(question: string, schema: Record<string, string[]>, maxRows: number) {
  const prompt = `You are a secure SQL assistant. Output JSON only with keys sql and explanation.\nConstraints: SELECT-only unless explicitly asked via capability (not given), one statement, no secrets, max rows ${maxRows}.\nAllowed schema: ${JSON.stringify(schema)}\nQuestion: ${question}\nExamples: {\"sql\":\"SELECT id FROM customers LIMIT 10\",\"explanation\":\"Get ids\"}`;
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    messages: [{ role: 'system', content: prompt }],
    response_format: { type: 'json_object' }
  });
  const text = res.choices[0]?.message?.content ?? '{"sql":"","explanation":"No output"}';
  return JSON.parse(text) as { sql: string; explanation: string };
}
