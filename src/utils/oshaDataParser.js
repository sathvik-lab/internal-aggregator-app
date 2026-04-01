/**
 * OSHA Data Parser
 *
 * Parses raw scraped OSHA page data strings into structured fields:
 * title, url, publishedTime, regulationBody.
 */

const TITLE_REGEX = /Title:\s*(.+?)(?:\n|\|)/;
const URL_REGEX = /URL Source:\s*(https?:\/\/[^\s\n]+)/;
const PUBLISHED_REGEX = /Published Time:\s*(.+?)(?:\n|$)/;

// Regulation number pattern: 1910.22, 1910.21(a), 1910.28(a)(1), etc.
const REG_NUM_PATTERN = /\d{4}\.\d+[a-z]?(?:\([a-z]\)(?:\(\d+\))?)?/i;

// Footer patterns that indicate end of regulation content
const FOOTER_PATTERNS = [
  /\[\d{2}\s+FR\s+\d+/i, // [81 FR 82983, Nov. 18, 2016]
  /\[Scroll to Top\]/i,
  /U\.S\. Department of Labor\s*$/m,
  /\*\s*\[OSHA\]\(https:\/\/www\.osha\.gov/,
];

// Markdown link: [text](url) -> text
const MD_LINK_REGEX = /\[([^\]]+)\]\(https?:\/\/[^]\s]+\)/g;

// [text](url) where URL contains ) - e.g. [1910.22(a)(1)](https://.../1910.22(a)(1))
const MD_LINK_URL_WITH_PAREN_REGEX = /\[([^\]]+)\]\(https?:\/\/[\s\S]*?\)\)/g;

// Fallback: text](url) when we sliced inside a link - remove "](url))" part
const TRAILING_LINK_REGEX = /(\d{4}\.\d+[a-z]?(?:\([a-z]\)(?:\(\d+\))?)?)\]\(https?:\/\/[\s\S]*?\)\)/g;

// Image markdown: ![alt](url)
const IMAGE_REGEX = /!\[[^\]]*\]\([^)]+\)/g;

/**
 * Extract header fields from data string.
 *
 * @param {string} data - Raw data string from osha-checklists.json item
 * @returns {{ title: string|null, url: string|null, publishedTime: string|null }}
 */
function extractHeader(data) {
  const title = data.match(TITLE_REGEX)?.[1]?.trim() ?? null;
  const url = data.match(URL_REGEX)?.[1]?.trim() ?? null;
  const publishedTime = data.match(PUBLISHED_REGEX)?.[1]?.trim() ?? null;
  return { title, url, publishedTime };
}

/**
 * Extract regulation number from title (e.g. "1910.22" from "1910.22 - General requirements.").
 *
 * @param {string|null} title
 * @returns {string|null}
 */
function extractRegulationNumber(title) {
  if (!title) return null;
  const match = title.match(/(\d{4}\.\d+)/);
  return match ? match[1] : null;
}

/**
 * Find start index of substantive regulation content.
 * Looks for first occurrence of regulation number pattern (e.g. 1910.22(a)).
 *
 * @param {string} data
 * @param {string|null} regNum - e.g. "1910.22"
 * @returns {number}
 */
function findRegulationStart(data, regNum) {
  if (regNum) {
    // Try regNum(a) or regNum(a)(1) etc.
    const patterns = [
      new RegExp(regNum.replace('.', '\\.') + '\\(a\\)', 'i'),
      new RegExp(regNum.replace('.', '\\.') + '\\(a\\)\\(1\\)', 'i'),
      new RegExp(regNum.replace('.', '\\.'), 'g'),
    ];
    for (const re of patterns) {
      const m = data.match(re);
      if (m) {
        const idx = data.indexOf(m[0]);
        if (idx >= 0) return idx;
      }
    }
  }
  // Fallback: first match of generic pattern
  const m = data.match(REG_NUM_PATTERN);
  return m ? data.indexOf(m[0]) : 0;
}

/**
 * Find end index of regulation content (start of footer).
 *
 * @param {string} data
 * @param {number} startIdx
 * @returns {number}
 */
function findRegulationEnd(data, startIdx) {
  const searchFrom = data.slice(startIdx);
  let minIdx = searchFrom.length;
  for (const pattern of FOOTER_PATTERNS) {
    const m = searchFrom.match(pattern);
    if (m) {
      const idx = searchFrom.indexOf(m[0]);
      if (idx >= 0 && idx < minIdx) minIdx = idx;
    }
  }
  return startIdx + minIdx;
}

/**
 * Clean regulation body: strip markdown links, images, trim boilerplate.
 *
 * @param {string} raw
 * @returns {string}
 */
function cleanRegulationBody(raw) {
  let text = raw;

  // Replace [text](url) with text (keep regulation refs)
  text = text.replace(MD_LINK_REGEX, '$1');

  // [text](url) where URL contains ) - e.g. OSHA interlinking URLs
  text = text.replace(MD_LINK_URL_WITH_PAREN_REGEX, '$1');

  // Fix regulation refs that were sliced mid-link: "1910.22(a)](url))" -> "1910.22(a)"
  text = text.replace(TRAILING_LINK_REGEX, '$1');

  // Remove image markdown
  text = text.replace(IMAGE_REGEX, '');

  // Collapse multiple newlines
  text = text.replace(/\n{3,}/g, '\n\n');

  // Trim
  return text.trim();
}

/**
 * Parse a single OSHA checklist item.
 *
 * @param {object} item - { data: string }
 * @returns {{ title: string|null, url: string|null, publishedTime: string|null, regulationBody: string, regulationNumber: string|null }}
 */
export function parseOshaItem(item) {
  const data = item?.data ?? '';
  const { title, url, publishedTime } = extractHeader(data);
  const regulationNumber = extractRegulationNumber(title);

  const startIdx = findRegulationStart(data, regulationNumber);
  const endIdx = findRegulationEnd(data, startIdx);
  let regulationBody = data.slice(startIdx, endIdx);
  regulationBody = cleanRegulationBody(regulationBody);

  return {
    title,
    url,
    publishedTime,
    regulationBody,
    regulationNumber,
  };
}

/**
 * Parse all items from osha-checklists.json array.
 *
 * @param {Array<{ data: string }>} items
 * @returns {Array<{ title, url, publishedTime, regulationBody, regulationNumber }>}
 */
export function parseOshaChecklists(items) {
  if (!Array.isArray(items)) return [];
  return items.map(parseOshaItem);
}

export default { parseOshaItem, parseOshaChecklists };
