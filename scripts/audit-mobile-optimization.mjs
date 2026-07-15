import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOTS = ['src/app', 'src/components'];
const BREAKPOINTS = [640, 680, 760, 860, 960, 1020, 1080, 1100, 1180];

function normalizePath(path) {
  return path.replaceAll('\\', '/');
}

function listFiles(root, exts) {
  const results = [];

  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.next') continue;
      const path = join(dir, entry);
      const stats = statSync(path);
      if (stats.isDirectory()) {
        walk(path);
        continue;
      }
      if (exts.includes(extname(path))) {
        results.push(normalizePath(path));
      }
    }
  }

  walk(root);
  return results;
}

const cssFiles = ROOTS.flatMap((root) => listFiles(root, ['.css']));
const tsxFiles = ROOTS.flatMap((root) => listFiles(root, ['.tsx', '.ts']));

const findings = [];

function addFinding(file, rule, detail) {
  findings.push({ file: relative(process.cwd(), file).replaceAll('\\', '/'), rule, detail });
}

// Rule 1: fixed pixel widths with no responsive counterpart in the same file.
for (const file of cssFiles) {
  const source = readFileSync(file, 'utf8');
  const hasMediaQuery = /@media\s*\(/.test(source);
  const fixedWidthMatches = [...source.matchAll(/width:\s*(\d{3,})px/g)];
  if (fixedWidthMatches.length > 0 && !hasMediaQuery) {
    addFinding(file, 'no-media-query-with-fixed-width', `${fixedWidthMatches.length} fixed px width declaration(s), no @media block in file`);
  }
}

// Rule 2: touch targets under 44px (buttons/icon-buttons sized below Apple/Material guidance).
for (const file of cssFiles) {
  const source = readFileSync(file, 'utf8');
  const blocks = source.split(/(?=[.#][\w-]+[^{]*\{)/g);
  for (const block of blocks) {
    const selectorMatch = block.match(/^([.#][\w-]+)/);
    if (!selectorMatch) continue;
    const isInteractive = /button|btn|icon|tap|click|toggle|nav-item|menu-item/i.test(selectorMatch[1]);
    if (!isInteractive) continue;
    const heightMatch = block.match(/(?:min-)?height:\s*(\d+)px/);
    const widthMatch = block.match(/(?:min-)?width:\s*(\d+)px/);
    if (heightMatch && Number(heightMatch[1]) < 40) {
      addFinding(file, 'touch-target-too-small', `${selectorMatch[1]} height ${heightMatch[1]}px (< 44px recommended)`);
    }
    if (widthMatch && Number(widthMatch[1]) < 40 && /icon|toggle/i.test(selectorMatch[1])) {
      addFinding(file, 'touch-target-too-small', `${selectorMatch[1]} width ${widthMatch[1]}px (< 44px recommended)`);
    }
  }
}

// Rule 3: text input font-size below 16px causes iOS Safari auto-zoom on focus.
for (const file of cssFiles) {
  const source = readFileSync(file, 'utf8');
  const inputBlocks = source.match(/(?:input|textarea|select)[^{]*\{[^}]*\}/gi) ?? [];
  for (const block of inputBlocks) {
    const fontMatch = block.match(/font-size:\s*(\d+(?:\.\d+)?)px/);
    if (fontMatch && Number(fontMatch[1]) < 16) {
      addFinding(file, 'ios-zoom-on-input-focus', `input font-size ${fontMatch[1]}px (< 16px triggers iOS zoom)`);
    }
  }
}

// Rule 4: horizontal-scroll risk — wide flex/grid rows without overflow handling or wrap.
for (const file of cssFiles) {
  const source = readFileSync(file, 'utf8');
  if (/grid-template-columns:\s*repeat\(\s*[5-9]/.test(source) && !/@media/.test(source)) {
    addFinding(file, 'wide-grid-no-responsive-fallback', 'grid-template-columns repeats 5+ columns with no @media narrowing');
  }
}

// Rule 5: fixed/absolute positioned bottom or top bars missing safe-area-inset handling.
for (const file of [...cssFiles, ...tsxFiles]) {
  const source = readFileSync(file, 'utf8');
  const hasFixedBottomOrTop = /position:\s*fixed[^;]*;[\s\S]{0,120}(bottom|top):\s*0|className="[^"]*fixed[^"]*(bottom|top)-0/.test(source);
  const hasSafeArea = /env\(safe-area-inset/.test(source);
  if (hasFixedBottomOrTop && !hasSafeArea) {
    addFinding(file, 'missing-safe-area-inset', 'fixed top/bottom bar without env(safe-area-inset-*) padding');
  }
}

// Rule 6: hover-only interactions with no click/press/focus fallback (dead on touch devices).
for (const file of cssFiles) {
  const source = readFileSync(file, 'utf8');
  const hoverBlocks = [...source.matchAll(/([.#][\w-]+):hover\s*\{([^}]*)\}/g)];
  for (const [, selector] of hoverBlocks) {
    const hasFocusOrActive = source.includes(`${selector}:focus`) || source.includes(`${selector}:active`) || source.includes(`${selector}[data-active`);
    const revealsContent = source.match(new RegExp(`${selector.replace(/[.#]/, '\\$&')}:hover\\s*\\{([^}]*)\\}`));
    const opacityReveal = revealsContent && /opacity:\s*1|display:\s*(block|flex)|visibility:\s*visible/.test(revealsContent[1]);
    if (opacityReveal && !hasFocusOrActive) {
      addFinding(file, 'hover-only-reveal', `${selector} reveals content only on :hover with no touch-accessible fallback`);
    }
  }
}

// Rule 7: viewport meta / metadata export presence in root layout.
const rootLayoutCandidates = ['src/app/layout.tsx'];
for (const candidate of rootLayoutCandidates) {
  try {
    const source = readFileSync(candidate, 'utf8');
    if (!/export const viewport/.test(source) && !/viewport:/.test(source)) {
      addFinding(candidate, 'no-explicit-viewport-export', 'no explicit `viewport` export — relying on Next.js default; confirm it is not overridden downstream');
    }
  } catch {
    // no root layout at this path, skip
  }
}

const byRule = findings.reduce((acc, finding) => {
  acc[finding.rule] = (acc[finding.rule] ?? 0) + 1;
  return acc;
}, {});

console.log('# Mobile optimization audit');
console.log('');
console.log(`Scanned roots: ${ROOTS.join(', ')}`);
console.log(`CSS files scanned: ${cssFiles.length}`);
console.log(`TSX/TS files scanned: ${tsxFiles.length}`);
console.log(`Total findings: ${findings.length}`);
console.log('');

for (const [rule, count] of Object.entries(byRule)) {
  console.log(`- ${rule}: ${count}`);
}
console.log('');

for (const finding of findings) {
  console.log(`[!] ${finding.file} | ${finding.rule} | ${finding.detail}`);
}

if (findings.length === 0) {
  console.log('No findings — heuristics did not flag anything. Manual device testing is still required.');
}
