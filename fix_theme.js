const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Pattern replacements requested
  content = content.replace(/bg-\[#0a0a0a\]/g, 'bg-[#fff1d6]');
  content = content.replace(/bg-\[#111111\]/g, 'bg-white');
  content = content.replace(/bg-\[#1A1A1A\]/g, 'bg-white');
  content = content.replace(/bg-\[#1a1a1a\]/g, 'bg-white');
  
  // text-white (replace text-white but not text-white/50 etc.)
  content = content.replace(/text-white(?!\/)/g, 'text-[#111827]');
  
  content = content.replace(/bg-black\/40/g, 'bg-white');
  content = content.replace(/bg-black\/35/g, 'bg-[#fff1d6]');
  content = content.replace(/border-white\/10/g, 'border-[#FFD896]');

  // Radial gradient replacement
  // We'll replace the existing complex radial gradients with the new one
  const oldGradientRegex = /bg-\[radial-gradient\([^\]]+\]/g;
  const newGradient = 'bg-[radial-gradient(900px_circle_at_15%_15%,rgba(249,115,22,0.10),transparent_55%),radial-gradient(900px_circle_at_85%_20%,rgba(251,146,60,0.08),transparent_55%)]';
  // Wait, let's just replace the exact gradient in app/page.tsx
  if (filePath.includes('app\\\\page.tsx') || filePath.includes('app/page.tsx')) {
      content = content.replace(/bg-\[radial-gradient\([^\]]+\]/, newGradient);
      // Navbar fix
      content = content.replace(/bg-white\/70 backdrop-blur/, 'bg-[#fff1d6]/80 backdrop-blur');
      // Wait, let's also specifically look for "bg-[#111111]/70 backdrop-blur" which is the navbar currently
      content = content.replace(/bg-[#111111]\/70 backdrop-blur/, 'bg-[#fff1d6]/80 backdrop-blur');
      content = content.replace(/bg-white\/80 backdrop-blur/, 'bg-[#fff1d6]/80 backdrop-blur');
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

walkDir(path.join(__dirname, 'app'), processFile);
walkDir(path.join(__dirname, 'components'), processFile);
