const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /text-amber-500/g, to: 'text-[#522B5B]' },
  { from: /text-amber-400/g, to: 'text-[#854F6C]' },
  { from: /text-amber-300/g, to: 'text-[#190019]' },
  { from: /text-amber-200/g, to: 'text-[#854F6C]' },
  
  { from: /bg-amber-500/g, to: 'bg-[#522B5B]' },
  { from: /bg-amber-400/g, to: 'bg-[#522B5B]' },
  { from: /bg-amber-50/g, to: 'bg-[#FBE4D8]' },
  { from: /bg-amber-100/g, to: 'bg-[#FEF0E8]' },
  { from: /border-amber-500/g, to: 'border-[#522B5B]' },
  { from: /border-amber-400/g, to: 'border-[#DFB6B2]' },
  { from: /border-amber-200/g, to: 'border-[#DFB6B2]' },
  { from: /bg-\[#FBE4D8\]0/g, to: 'bg-[#FBE4D8]' },
  { from: /shadow-\[0_12px_40px_rgba\(249,115,22,0.25\)\]/g, to: 'shadow-medium' },
  { from: /shadow-medium\]/g, to: 'shadow-medium' },
  { from: /shadow-medium/g, to: 'shadow-medium' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      for (const { from, to } of replacements) {
        newContent = newContent.replace(from, to);
      }
      
      // Fix step 10 Badges manually if they match old format
      newContent = newContent.replace(/bg-\[#522B5B\]\/10 text-\[#522B5B\]/g, 'bg-[#522B5B]/10 text-[#522B5B] border border-[#522B5B]/20 rounded-full');
      
      if (content !== newContent) {
        console.log(`Updated ${fullPath}`);
        fs.writeFileSync(fullPath, newContent);
      }
    }
  }
}

try {
  processDirectory(path.join(__dirname, 'app'));
  processDirectory(path.join(__dirname, 'components'));
  console.log('Replacements complete.');
} catch (e) {
  console.error(e);
}
