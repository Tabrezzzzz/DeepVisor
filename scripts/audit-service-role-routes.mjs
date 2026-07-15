import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src/app/api', 'src/lib/server/actions'];
const PUBLIC_ALLOWLIST = new Set([
  'src/app/api/health/route.ts',
  'src/app/api/meta/data-deletion/route.ts',
]);
const CONTEXT_HELPER_ALLOWLIST = new Set([
  'src/lib/server/actions/app/workspace-selection.ts',
  'src/lib/server/actions/business/context.ts',
]);

function normalizePath(path) {
  return path.replaceAll('\\', '/');
}

function listTypeScriptFiles(root) {
  const results = [];

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      const stats = statSync(path);
      if (stats.isDirectory()) {
        walk(path);
        continue;
      }

      if (path.endsWith('.ts') || path.endsWith('.tsx')) {
        results.push(normalizePath(path));
      }
    }
  }

  walk(root);
  return results;
}

const files = ROOTS.flatMap(listTypeScriptFiles).sort();
const findings = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  if (!source.includes('createAdminClient(')) {
    continue;
  }

  const hasAppContext = source.includes('getRequiredAppContext(');
  const hasInternalGuard = source.includes('requireInternalRequest(');
  const publicAllowlisted = PUBLIC_ALLOWLIST.has(file);
  const contextHelperAllowlisted = CONTEXT_HELPER_ALLOWLIST.has(file);
  const validatesBusinessScope =
    source.includes('.eq(\'business_id\'') ||
    source.includes('.eq("business_id"') ||
    source.includes('businessId,') ||
    source.includes('businessId:');

  findings.push({
    file,
    hasAppContext,
    hasInternalGuard,
    publicAllowlisted,
    validatesBusinessScope,
    status:
      hasAppContext || hasInternalGuard || publicAllowlisted || contextHelperAllowlisted
        ? 'review'
        : 'needs-auth-boundary',
  });
}

const risky = findings.filter((finding) => finding.status === 'needs-auth-boundary');

console.log('# Service-role route/action audit');
console.log('');
console.log(`Scanned roots: ${ROOTS.join(', ')}`);
console.log(`Admin-client files: ${findings.length}`);
console.log(`Needs auth boundary review: ${risky.length}`);
console.log('');

for (const finding of findings) {
  const label = finding.status === 'needs-auth-boundary' ? '[!]' : '[ ]';
  console.log(
    `${label} ${relative(process.cwd(), finding.file).replaceAll('\\', '/')}` +
      ` | appContext=${finding.hasAppContext}` +
      ` internal=${finding.hasInternalGuard}` +
      ` publicAllowlist=${finding.publicAllowlisted}` +
      ` contextHelper=${CONTEXT_HELPER_ALLOWLIST.has(finding.file)}` +
      ` businessScopeHint=${finding.validatesBusinessScope}`
  );
}

if (risky.length > 0) {
  console.log('');
  console.log('Risky files need explicit auth, internal auth, or public-route justification before production.');
}
