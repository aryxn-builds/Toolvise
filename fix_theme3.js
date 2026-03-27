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

  // Cleanup all border-white with any opacity
  content = content.replace(/border-white\/?(\d+|\[.*?\])?/g, 'border-[#FFD896]');
  
  // Cleanup all text-white with any opacity
  content = content.replace(/text-white\/?(\d+|\[.*?\])?/g, (match, pct) => {
    return 'text-[#111827]' + (pct ? '/' + pct : '');
  });

  // Cleanup all remaining bg-white with opacities
  content = content.replace(/bg-white\/(5|8|10|15|20|25|30|50|\[.*?\])/g, 'bg-white');

  // specific remnant bg
  content = content.replace(/bg-\[#111\]/g, 'bg-white');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated more classes: ${filePath}`);
  }
}

walkDir(path.join(__dirname, 'app'), processFile);
walkDir(path.join(__dirname, 'components'), processFile);
