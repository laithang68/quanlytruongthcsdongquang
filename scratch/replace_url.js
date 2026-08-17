const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if ((fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) && !fullPath.endsWith('api.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('http://localhost:3001')) {
        let hasImport = content.includes("import { getApiUrl");
        if (!hasImport) {
          content = "import { getApiUrl } from '@/lib/api';\n" + content;
        }

        // Replace 'http://localhost:3001...' with getApiUrl('...')
        content = content.replace(/'http:\/\/localhost:3001([^']*)'/g, "getApiUrl('$1')");
        // Replace `http://localhost:3001...` with getApiUrl(`...`)
        content = content.replace(/`http:\/\/localhost:3001([^`]*)`/g, "getApiUrl(`$1`)");

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Successfully updated:', fullPath);
      }
    }
  }
}

walk(path.join(__dirname, '../frontend/src'));
