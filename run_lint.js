const { execSync } = require('child_process');
const fs = require('fs');

try {
  execSync('npx eslint "src/**/*.{ts,tsx}" --format json', { stdio: 'pipe' });
  console.log('No lint errors found.');
} catch (error) {
  if (error.stdout) {
    try {
      const output = JSON.parse(error.stdout.toString());
      const filtered = output.filter(f => f.errorCount > 0 || f.warningCount > 0)
        .map(f => ({
          file: f.filePath,
          messages: f.messages.map(m => `[${m.line}:${m.column}] ${m.ruleId}: ${m.message}`)
        }));
      fs.writeFileSync('lint_output.json', JSON.stringify(filtered, null, 2), 'utf8');
      console.log('Lint errors dumped to lint_output.json');
    } catch(e) {
      console.error('Failed to parse eslint output', e);
    }
  } else {
    console.error('ESLint failed completely', error);
  }
}
