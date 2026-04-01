#!/usr/bin/env node
/**
 * Generate a DB-ready seed file for Firestore `checklistTemplates`.
 *
 * Input:  converted-templates.json (array of templates without timestamps)
 * Output: checklistTemplates.seed.json (object with { checklistTemplates: [...] })
 *
 * Notes:
 * - Firestore Timestamp fields are represented as ISO strings in the seed JSON.
 * - This is compatible with the app code, which tolerates either Timestamps or strings.
 */

const fs = require('fs');
const path = require('path');

function getArg(args, name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}

function hasFlag(args, name) {
  return args.includes(name);
}

function main() {
  const args = process.argv.slice(2);
  const inputPath =
    getArg(args, '--input') ||
    path.join(process.cwd(), 'converted-templates.json');
  const outputPath =
    getArg(args, '--output') ||
    path.join(process.cwd(), 'checklistTemplates.seed.json');

  const nowIso = new Date().toISOString();
  const createdAt = getArg(args, '--createdAt') || nowIso;
  const updatedAt = getArg(args, '--updatedAt') || createdAt;
  const keepExistingTimestamps = hasFlag(args, '--keep-existing-timestamps');

  if (!fs.existsSync(inputPath)) {
    console.error('Input not found:', inputPath);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  if (!Array.isArray(raw)) {
    console.error('Expected input to be an array:', inputPath);
    process.exit(1);
  }

  const templates = raw.map((t) => {
    const next = { ...t };

    if (!keepExistingTimestamps || next.createdAt == null) next.createdAt = createdAt;
    if (!keepExistingTimestamps || next.updatedAt == null) next.updatedAt = updatedAt;

    // Ensure required fields exist (best-effort). Do not invent content.
    if (!('isActive' in next)) next.isActive = true;
    if (!('version' in next)) next.version = 1;
    if (!('source' in next)) next.source = 'osha_generated';

    return next;
  });

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const payload = { checklistTemplates: templates };
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log('Wrote seed file:', outputPath);
  console.log('Templates:', templates.length);
}

main();

