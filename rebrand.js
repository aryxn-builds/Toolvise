const fs = require('fs');
const path = require('path');

const replacements = [
  // BACKGROUNDS
  { from: /bg-\[#fff1d6\]/g, to: 'bg-[#FBE4D8]' },
  { from: /bg-\[#FFF1D6\]/g, to: 'bg-[#FBE4D8]' },
  { from: /bg-\[#F97316\]/g, to: 'bg-[#522B5B]' },
  { from: /bg-\[#EA6C0A\]/g, to: 'bg-[#2B124C]' },
  { from: /bg-\[#FB923C\]/g, to: 'bg-[#854F6C]' },
  { from: /bg-\[#FFE8B6\]/g, to: 'bg-[#F5D5CF]' },

  // BORDERS
  { from: /border-\[#FFD896\]/g, to: 'border-[#DFB6B2]' },
  { from: /border-\[#F97316\]/g, to: 'border-[#522B5B]' },
  { from: /border-amber-200/g, to: 'border-[#DFB6B2]' },

  // TEXT
  { from: /text-\[#111827\]/g, to: 'text-[#190019]' },
  { from: /text-\[#374151\]/g, to: 'text-[#2B124C]' },
  { from: /text-\[#6B7280\]/g, to: 'text-[#854F6C]' },
  { from: /text-\[#9CA3AF\]/g, to: 'text-[#C48FA0]' },
  { from: /text-\[#F97316\]/g, to: 'text-[#522B5B]' },
  { from: /text-\[#FB923C\]/g, to: 'text-[#854F6C]' },
  { from: /text-\[#EA6C0A\]/g, to: 'text-[#2B124C]' },

  // RINGS AND FOCUS
  { from: /ring-\[#F97316\]/g, to: 'ring-[#522B5B]' },

  // HOVER STATES
  { from: /hover:bg-\[#fff1d6\]/g, to: 'hover:bg-[#FBE4D8]' },
  { from: /hover:bg-\[#EA6C0A\]/g, to: 'hover:bg-[#2B124C]' },
  { from: /hover:bg-\[#F97316\]/g, to: 'hover:bg-[#522B5B]' },
  { from: /hover:text-\[#F97316\]/g, to: 'hover:text-[#522B5B]' },

  // GRADIENTS
  { from: /from-\[#F97316\]/g, to: 'from-[#522B5B]' },
  { from: /to-\[#FB923C\]/g, to: 'to-[#854F6C]' },
  { from: /from-amber-400/g, to: 'from-plum-500' },
  { from: /to-orange-300/g, to: 'to-plum-400' },
  { from: /from-amber-200/g, to: 'from-[#DFB6B2]' },
  { from: /bg-amber-50/g, to: 'bg-[#FBE4D8]' },
  { from: /bg-gradient-to-br from-\[#F97316\] to-\[#FB923C\]/g, to: 'bg-gradient-to-br from-[#522B5B] to-[#854F6C]' },
  { from: /border-none/g, to: 'border-none' }, // just a placeholder

  // OTHERS
  { from: /rounded-none/g, to: 'rounded-lg' },
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
