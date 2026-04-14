/**
 * OSHA Extractor
 *
 * Extracts structured compliance tasks from parsed OSHA regulation text.
 * Supports rule-based extraction (default) and LLM extraction (when API key available).
 */

/**
 * Extract tasks from regulation body using rule-based parsing.
 * Splits on OSHA subsection patterns and creates one task per logical requirement.
 *
 * @param {string} regulationBody - Cleaned regulation text
 * @param {object} context - { title, url, regulationNumber }
 * @returns {Array<object>} Array of task objects (input-schema format)
 */
export function extractTasksRuleBased(regulationBody, context = {}) {
  if (!regulationBody || typeof regulationBody !== 'string') return [];

  const { regulationNumber, url } = context;
  const tasks = [];

  // Split into sections by regulation reference pattern
  const parts = regulationBody.split(/(?=\d{4}\.\d+[a-z]?(?:\([a-z]\)(?:\(\d+\))?)?)/i);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part || part.length < 20) continue;

    const lines = part.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // First line may be regulation ref and/or _Heading_
    let heading = '';
    let descriptionStart = 0;

    const firstLine = lines[0];
    const headingMatch = firstLine.match(/_([^_]+)_/);
    if (headingMatch) {
      heading = headingMatch[1].trim();
      descriptionStart = 1;
    }

    const descLines = lines.slice(descriptionStart);
    let description = descLines.join(' ').replace(/\s+/g, ' ').trim();

    if (!description || description.length < 15) continue;

    // Strip leading regulation ref from description if present (e.g. "1910.22(a)(1) Text" -> "Text")
    description = description.replace(
      /^\d{4}\.\d+[a-z]?(?:\([a-z]\)(?:\(\d+\))?)?\s*/i,
      ''
    ).trim() || description;

    // Build title: use heading if present, else first ~60 chars of description
    const taskTitle = heading || description.substring(0, 60).replace(/\s+\w*$/, '');

    tasks.push({
      title: taskTitle,
      description,
      category: 'Worker Safety',
      priority: 'medium',
      applicableTo: {
        truckTypes: null,
        foodTypes: null,
        businessTypes: null,
        locations: { states: null, cities: null },
        complianceAreas: ['worker_safety'],
      },
      frequency: 'monthly',
      defaultDueTime: '09:00',
      source: 'osha_generated',
      version: 1,
      isActive: true,
      regulationReference:
        regulationNumber && url
          ? {
              regulationNumber,
              url,
              section: heading || taskTitle,
            }
          : null,
      startDate: null,
      endDate: null,
    });
  }

  return tasks;
}

/**
 * Extract tasks using LLM (OpenAI-compatible API).
 *
 * @param {string} regulationBody
 * @param {object} context - { title, url, regulationNumber }
 * @param {string} promptContent - Full prompt from output-schema.md
 * @returns {Promise<Array<object>>}
 */
export async function extractTasksWithLLM(
  regulationBody,
  context,
  promptContent
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for LLM extraction');
  }

  const userContent = `Regulation title: ${context.title ?? 'N/A'}\nURL: ${context.url ?? 'N/A'}\n\nRegulation text:\n\n${regulationBody}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: promptContent },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  const results = parsed.results ?? [];

  const { regulationNumber, url } = context;
  return results.map((r) => ({
    ...r,
    regulationReference:
      r.regulationReference ?? (regulationNumber && url
        ? { regulationNumber, url, section: r.title ?? '' }
        : null),
  }));
}

/**
 * Extract tasks from parsed OSHA item.
 *
 * @param {object} parsedItem - { title, url, regulationBody, regulationNumber }
 * @param {object} options - { method: 'rules'|'llm', promptContent?: string }
 * @returns {Promise<Array<object>>}
 */
export async function extractTasks(parsedItem, options = {}) {
  const { method = 'rules', promptContent } = options;
  const context = {
    title: parsedItem.title,
    url: parsedItem.url,
    regulationNumber: parsedItem.regulationNumber,
  };

  if (method === 'llm' && promptContent) {
    return extractTasksWithLLM(
      parsedItem.regulationBody,
      context,
      promptContent
    );
  }

  return extractTasksRuleBased(parsedItem.regulationBody, context);
}

export default { extractTasks, extractTasksRuleBased, extractTasksWithLLM };
