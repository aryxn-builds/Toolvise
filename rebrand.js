const fs = require('fs');
const path = require('path');

const replacements = [
  // Backgrounds
  { from: /bg-\[#0A0A0A\]\/80/g, to: 'bg-[#0D1117]/80' },
  { from: /bg-\[#0A0A0A\]\/60/g, to: 'bg-[#0D1117]/60' },
  { from: /bg-\[#0A0A0A\]/g, to: 'bg-[#0D1117]' },
  { from: /bg-\[#111111\]/g, to: 'bg-[#161B22]' },
  { from: /bg-\[#0F0F0F\]/g, to: 'bg-[#0D1117]' },
  { from: /bg-\[#141414\]/g, to: 'bg-[#1C2128]' },
  { from: /bg-\[#161616\]/g, to: 'bg-[#1C2128]' },

  // Primary
  { from: /bg-\[#4F8EF7\]\/10/g, to: 'bg-[#2EA043]/10' },
  { from: /bg-\[#4F8EF7\]\/12/g, to: 'bg-[#2EA043]/12' },
  { from: /bg-\[#4F8EF7\]\/15/g, to: 'bg-[#2EA043]/12' },
  { from: /bg-\[#4F8EF7\]\/5/g, to: 'bg-[#2EA043]/8' },
  { from: /bg-\[#4F8EF7\]/g, to: 'bg-[#2EA043]' },
  { from: /bg-\[#3B7AF3\]/g, to: 'bg-[#238636]' },

  // Accent
  { from: /bg-\[#00D4FF\]\/10/g, to: 'bg-[#1ABC9C]/10' },
  { from: /bg-\[#00D4FF\]/g, to: 'bg-[#1ABC9C]' },
  { from: /bg-\[#7C3AED\]\/10/g, to: 'bg-[#388BFD]/10' },
  { from: /bg-\[#7C3AED\]\/12/g, to: 'bg-[#388BFD]/10' },
  { from: /bg-\[#7C3AED\]\/8/g, to: 'bg-[#388BFD]/8' },
  { from: /bg-\[#7C3AED\]/g, to: 'bg-[#388BFD]' },

  // Text
  { from: /text-\[#F8F8F8\]/g, to: 'text-[#E6EDF3]' },
  // text-white -> text-[#E6EDF3]  (only on some places, let's do this manually to avoid breaking buttons? Actually buttons are using custom classes now, so I'll replace text-white with text-[#E6EDF3])
  { from: /text-white\/60/g, to: 'text-[#8B949E]' },
  { from: /text-white\/70/g, to: 'text-[#8B949E]' },
  { from: /text-white\/80/g, to: 'text-[#E6EDF3]/80' },
  { from: /text-white\/50/g, to: 'text-[#8B949E]/80' },
  { from: /text-white\/40/g, to: 'text-[#484F58]' },
  { from: /text-white\/30/g, to: 'text-[#484F58]/70' },
  { from: /text-white/g, to: 'text-[#E6EDF3]' }, // Broad replacement, revert explicitly if needed

  { from: /text-\[#A0A0A0\]/g, to: 'text-[#8B949E]' },
  { from: /text-\[#606060\]/g, to: 'text-[#484F58]' },
  { from: /text-\[#4F8EF7\]/g, to: 'text-[#2EA043]' },
  { from: /text-\[#00D4FF\]/g, to: 'text-[#1ABC9C]' },
  { from: /text-\[#7C3AED\]/g, to: 'text-[#388BFD]' },
  { from: /text-\[#A78BFA\]/g, to: 'text-[#BC8CFF]' },

  // Borders
  { from: /border-white\/8/g, to: 'border-[rgba(240,246,252,0.10)]' },
  { from: /border-white\/10/g, to: 'border-[rgba(240,246,252,0.10)]' },
  { from: /border-white\/12/g, to: 'border-[rgba(240,246,252,0.12)]' },
  { from: /border-white\/15/g, to: 'border-[rgba(240,246,252,0.15)]' },
  { from: /border-white\/6/g, to: 'border-[rgba(240,246,252,0.06)]' },
  { from: /border-white\/5/g, to: 'border-[rgba(240,246,252,0.05)]' },
  
  { from: /border-\[#4F8EF7\]\/25/g, to: 'border-[#2EA043]/25' },
  { from: /border-\[#4F8EF7\]\/30/g, to: 'border-[#2EA043]/30' },
  { from: /border-\[#4F8EF7\]\/40/g, to: 'border-[#2EA043]/35' },
  { from: /border-\[#4F8EF7\]\/50/g, to: 'border-[#2EA043]/40' },
  { from: /border-\[#4F8EF7\]/g, to: 'border-[#2EA043]' },
  
  { from: /border-\[#00D4FF\]\/15/g, to: 'border-[#1ABC9C]/15' },
  { from: /border-\[#7C3AED\]\/20/g, to: 'border-[#388BFD]/18' },

  // Gradients
  { from: /from-white via-\[#4F8EF7\] to-\[#00D4FF\]/g, to: 'from-[#E6EDF3] via-[#2EA043] to-[#1ABC9C]' },
  { from: /from-\[#4F8EF7\] to-\[#00D4FF\]/g, to: 'from-[#2EA043] to-[#1ABC9C]' },
  { from: /from-\[#4F8EF7\] to-\[#3B7AF3\]/g, to: 'from-[#3FB950] to-[#2EA043]' },
  { from: /from-\[#4F8EF7\]/g, to: 'from-[#2EA043]' },
  { from: /to-\[#4F8EF7\]/g, to: 'to-[#2EA043]' },
  { from: /via-\[#4F8EF7\]/g, to: 'via-[#2EA043]' },

  // Hover/Focus
  { from: /hover:bg-\[#3B7AF3\]/g, to: 'hover:bg-[#238636]' },
  { from: /hover:bg-\[#4F8EF7\]/g, to: 'hover:bg-[#2EA043]' },
  { from: /hover:text-\[#4F8EF7\]/g, to: 'hover:text-[#2EA043]' },
  { from: /hover:text-\[#00D4FF\]/g, to: 'hover:text-[#1ABC9C]' },
  { from: /hover:border-\[#4F8EF7\]\/20/g, to: 'hover:border-[#2EA043]/18' },
  
  { from: /focus:border-\[#4F8EF7\]\/50/g, to: 'focus:border-[#2EA043]/40' },
  { from: /focus:ring-\[#4F8EF7\]\/20/g, to: 'focus:ring-[#2EA043]/15' },

  // Specific removals based on instructions
  { from: /bg-white/g, to: 'bg-[#161B22]' }  // The instruction said `bg-white -> bg-[#161B22] (only when used as card bg)`. Since this is a dark theme, it's safe to replace.
];

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { from, to } of replacements) {
        content = content.replace(from, to);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'app'));
processDirectory(path.join(__dirname, 'components'));
console.log('Done!');
