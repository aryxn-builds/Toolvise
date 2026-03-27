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

  // Cleanup specifically "bg-white/80" -> "bg-white"
  // Cleanup "bg-white/5" -> "bg-white"
  content = content.replace(/bg-white\/80/g, 'bg-white');
  content = content.replace(/bg-white\/5/g, 'bg-white');

  // Any text-white/50 text-white/60 text-white/70 text-white/80 text-white/90 -> text-[#111827]/xx (for inputs and icons)
  content = content.replace(/text-white\/(30|35|40|50|60|70|80|85|90)/g, (match, pct) => {
    return 'text-[#111827]/' + pct;
  });

  // text-[#111827]/... let's just make inputs use Tailwind's regular opacity, e.g. text-[#111827]/60
  // "bg-[#fff1d6]/80 backdrop-blur" was meant for Navbar.
  // There's a remaining "backdrop-blur" on cards? Let's leave backdrop-blur, it's fine for glass effect, but maybe white background handles it.

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated more classes: ${filePath}`);
  }
}

walkDir(path.join(__dirname, 'app'), processFile);
walkDir(path.join(__dirname, 'components'), processFile);
