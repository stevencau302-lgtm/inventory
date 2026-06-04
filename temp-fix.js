const fs = require('fs');
const path = require('path');

const basePath = __dirname;

const files = [
  'src/app/(dashboard)/transactions/page.tsx',
  'src/app/(dashboard)/categories/page.tsx',
  'src/app/(dashboard)/stock-opname/page.tsx',
  'src/app/(dashboard)/reports/page.tsx',
  'src/app/(dashboard)/settings/page.tsx',
  'src/app/(dashboard)/laporan-stok/page.tsx',
];

files.forEach(filePath => {
  const fullPath = path.join(basePath, filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // Replace text-white (standalone, not part of hover:text-white)
  // Match text-white that's preceded by a space or quote and followed by space/quote/end
  content = content.replace(/(?<=\s|"|')text-white(?=\s|"|')/g, 'text-gray-900');
  
  // Fix inline style backgrounds
  content = content.replace(/background: '#18181b'/g, "background: '#ffffff'");
  content = content.replace(/border: '1px solid rgba\(255,255,255,0\.1\)'/g, "border: '1px solid #e5e7eb'");
  
  // Fix colorScheme
  content = content.replace(/colorScheme: 'dark'/g, "colorScheme: 'light'");
  
  // Fix placeholder colors
  content = content.replace(/placeholder-white\/20/g, 'placeholder-gray-400');
  content = content.replace(/placeholder-zinc-600/g, 'placeholder-gray-400');
  
  // Fix glass-card class (in categories)
  content = content.replace(/glass-card/g, 'rounded-xl bg-white border border-gray-200');
  
  // Fix indigo-600 text color
  content = content.replace(/text-indigo-600/g, 'text-[#072C2C]');
  
  // Fix shadow
  content = content.replace(/shadow-inner shadow-indigo-900\/50/g, 'shadow-inner shadow-[#072C2C]/20');
  
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log('PASS2:', filePath);
});

console.log('Second pass complete!');
