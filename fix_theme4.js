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

  // Replace header background with the one requested by user
  // We'll just look for `<header` and replace the backgrounds inside its className if possible, 
  // or just run a specific replace for the exact strings we saw:
  // "bg-[#fff1d6]/80 backdrop-blur"
  
  // From app/about/page.tsx etc: bg-white backdrop-blur-md
  // From app/page.tsx: bg-[#fff1d6]/80 backdrop-blur (my script already did it)
  
  content = content.replace(/bg-white backdrop-blur-md/g, 'bg-[#fff1d6]/80 backdrop-blur-md');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated header/backdrop classes: ${filePath}`);
  }
}

walkDir(path.join(__dirname, 'app'), processFile);
