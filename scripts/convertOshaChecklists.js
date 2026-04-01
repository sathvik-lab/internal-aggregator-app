#!/usr/bin/env node
/**
 * OSHA Checklist Conversion Script
 *
 * Converts osha-checklists.json (raw scraped OSHA pages) into ChecklistTemplate
 * format. Supports rule-based and LLM extraction.
 *
 * Usage:
 *   node scripts/convertOshaChecklists.js [options]
 *
 * Options:
 *   --input <path>       Input JSON file (default: osha-checklists.json)
 *   --output <path>      Output JSON file (default: converted-templates.json)
 *   --extract-method     rules | llm (default: rules)
 *   --firestore          Write to Firestore (default: false, output JSON only)
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : null;
  };
  const hasFlag = (name) => args.includes(name);

  const inputPath =
    getArg('--input') ||
    path.join(process.cwd(), 'osha-checklists.json');
  const outputPath =
    getArg('--output') ||
    path.join(process.cwd(), 'converted-templates.json');
  const extractMethod = getArg('--extract-method') || 'rules';
  const writeFirestore = hasFlag('--firestore');

  console.log('OSHA Checklist Conversion');
  console.log('  Input:', inputPath);
  console.log('  Output:', outputPath);
  console.log('  Extract method:', extractMethod);
  console.log('  Firestore write:', writeFirestore);

  // Dynamic imports for ESM modules
  const { parseOshaChecklists } = await import(
    path.join(process.cwd(), 'src/utils/oshaDataParser.js')
  );
  const { extractTasks } = await import(
    path.join(process.cwd(), 'src/utils/oshaExtractor.js')
  );
  const { convertToChecklistTemplate } = await import(
    path.join(process.cwd(), 'src/utils/oshaChecklistConverter.js')
  );

  // Load output-schema.md for LLM prompt
  const promptPath = path.join(process.cwd(), 'output-schema.md');
  let promptContent = '';
  if (extractMethod === 'llm' && fs.existsSync(promptPath)) {
    promptContent = fs.readFileSync(promptPath, 'utf8');
  }

  // Load input
  if (!fs.existsSync(inputPath)) {
    console.error('Input file not found:', inputPath);
    process.exit(1);
  }

  const rawInput = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const items = Array.isArray(rawInput) ? rawInput : rawInput.results ?? rawInput.data ?? [];
  if (!Array.isArray(items)) {
    console.error('Input must be an array of items with "data" field');
    process.exit(1);
  }

  // Parse
  const parsed = parseOshaChecklists(items);
  console.log('Parsed', parsed.length, 'OSHA pages');

  // Extract
  const allTasks = [];
  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i];
    if (!p.regulationBody) {
      console.log('  Skipping', p.title, '(no regulation body)');
      continue;
    }
    try {
      const tasks = await extractTasks(p, {
        method: extractMethod,
        promptContent,
      });
      allTasks.push(...tasks.map((t) => ({ ...t, _parserContext: p })));
      if (tasks.length > 0) {
        console.log('  Extracted', tasks.length, 'tasks from', p.title);
      }
    } catch (err) {
      console.warn('  Extraction failed for', p.title, ':', err.message);
    }

    // Throttle LLM calls
    if (extractMethod === 'llm' && i < parsed.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Convert each task with its parser context
  const templates = [];
  const seenIds = new Set();

  allTasks.forEach((task, index) => {
    const ctx = task._parserContext || {};
    const { _parserContext, ...taskClean } = task;
    const t = convertToChecklistTemplate(taskClean, {
      regulationNumber: ctx.regulationNumber,
      url: ctx.url,
      index,
      forFirestore: false,
    });
    if (t && !seenIds.has(t.id)) {
      seenIds.add(t.id);
      templates.push(t);
    }
  });

  console.log('Total templates:', templates.length);

  // Write JSON
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(
    outputPath,
    JSON.stringify(templates, null, 2),
    'utf8'
  );
  console.log('Wrote', outputPath);

  // Optional Firestore write
  if (writeFirestore) {
    try {
      const admin = await import('firebase-admin');
      if (!admin.default.apps?.length) {
        console.warn(
          'Firebase Admin not initialized. Set GOOGLE_APPLICATION_CREDENTIALS or call admin.initializeApp().'
        );
      } else {
        const db = admin.default.firestore();
        const batch = db.batch();
        const ref = db.collection('checklistTemplates');
        const now = admin.default.firestore.FieldValue.serverTimestamp();
        for (const t of templates) {
          const docRef = ref.doc(t.id);
          batch.set(docRef, {
            ...t,
            createdAt: now,
            updatedAt: now,
          });
        }
        await batch.commit();
        console.log('Wrote', templates.length, 'templates to Firestore');
      }
    } catch (err) {
      console.warn('Firestore write skipped:', err.message);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
