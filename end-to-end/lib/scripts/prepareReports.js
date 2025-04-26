const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const resultsDir = path.resolve('./build/reports/wdio-html-nice-reporter-results');
const tempDir = path.join(resultsDir, 'temp');
const reportsDir = path.resolve('./build/reports/wdio-html-nice-reporter-reports');

async function moveRecursive(src, dest) {
  const stat = await fs.promises.stat(src);

  if (stat.isDirectory()) {
    await fs.promises.mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(src);
    for (const entry of entries) {
      await moveRecursive(path.join(src, entry), path.join(dest, entry));
    }
    await fs.promises.rmdir(src);
  } else {
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });
    await fs.promises.rename(src, dest);
  }
}

async function prepare() {
  await fs.promises.mkdir(resultsDir, { recursive: true });

  // --- 🔥 NEW: Check if any .json files exist
  const allFiles = await fs.promises.readdir(resultsDir);
  const jsonFiles = allFiles.filter(file => file.endsWith('.json'));
  if (jsonFiles.length === 0) {
    console.log(`✅ No JSON files found in ${resultsDir}. Nothing to process.`);
    return;
  }

  // --- Continue if there are JSON files ---
  for (const file of allFiles) {
    if (file === 'temp') continue;
    const srcPath = path.join(resultsDir, file);
    const destPath = path.join(tempDir, file);
    await moveRecursive(srcPath, destPath);
  }

  console.log('📦 Files moved to temp folder.');

  console.log('🚀 Running mergeResults.js...');
  execSync(`node lib/scripts/mergeResults.js ${resultsDir} ${reportsDir}`, { stdio: 'inherit' });

  const tempFiles = await fs.promises.readdir(tempDir);
  for (const file of tempFiles) {
    if (file.endsWith('.json')) {
      await fs.promises.unlink(path.join(tempDir, file));
    }
  }

  console.log('🧹 JSON files deleted.');

  for (const file of await fs.promises.readdir(tempDir)) {
    const srcPath = path.join(tempDir, file);
    const destPath = path.join(reportsDir, file);
    await moveRecursive(srcPath, destPath);
  }

  console.log('🏁 Remaining files moved to reports directory.');
}

prepare().catch(error => {
  console.error('❌ Error during prepareReports:', error);
  process.exit(1);
});
