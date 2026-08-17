const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes("'use client';") || content.includes('"use client";')) {
        // Ensure 'use client'; is the very first line
        content = content.replace(/['"]use client['"];?\s*/g, '');
        content = "'use client';\n\n" + content.trim();
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed use client header in:', fullPath);
      }
    }
  }
}

walk(path.join(__dirname, '../frontend/src/app'));
