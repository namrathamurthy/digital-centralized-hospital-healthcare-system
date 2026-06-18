const fs = require('fs');
const path = require('path');

const directories = [
  'patient-dashboard',
  'doctor-dashboard',
  'receptionist-dashboard',
  'billing-dashboard',
  'pharmacy-dashboard',
  'lab-dashboard'
];

const replacements = [
  { regex: /bg-\[\#07090e\]/g, replacement: 'bg-slate-50' },
  { regex: /bg-zinc-950\/20/g, replacement: 'bg-white/80' },
  { regex: /bg-zinc-950\/40/g, replacement: 'bg-white/90' },
  { regex: /bg-zinc-950\/60/g, replacement: 'bg-white' },
  { regex: /bg-zinc-950/g, replacement: 'bg-white' },
  
  { regex: /bg-zinc-900\/10/g, replacement: 'bg-slate-50' },
  { regex: /bg-zinc-900\/20/g, replacement: 'bg-slate-50' },
  { regex: /bg-zinc-900\/30/g, replacement: 'bg-slate-50' },
  { regex: /bg-zinc-900\/40/g, replacement: 'bg-slate-50' },
  { regex: /bg-zinc-900\/60/g, replacement: 'bg-slate-50' },
  { regex: /bg-zinc-900/g, replacement: 'bg-slate-50' },
  
  { regex: /bg-zinc-800\/80/g, replacement: 'bg-slate-100' },
  { regex: /bg-zinc-800\/60/g, replacement: 'bg-slate-100' },
  { regex: /bg-zinc-800/g, replacement: 'bg-slate-100' },
  
  { regex: /bg-black\/40/g, replacement: 'bg-slate-50' },
  { regex: /bg-black\/35/g, replacement: 'bg-slate-50' },

  { regex: /border-zinc-800\/80/g, replacement: 'border-slate-200' },
  { regex: /border-zinc-800\/60/g, replacement: 'border-slate-200' },
  { regex: /border-zinc-800\/40/g, replacement: 'border-slate-200' },
  { regex: /border-zinc-800/g, replacement: 'border-slate-200' },
  { regex: /border-zinc-850/g, replacement: 'border-slate-200' },
  { regex: /border-zinc-700/g, replacement: 'border-slate-300' },

  { regex: /text-white/g, replacement: 'text-slate-800' },
  { regex: /text-zinc-100/g, replacement: 'text-slate-800' },
  { regex: /text-zinc-200/g, replacement: 'text-slate-800' },
  { regex: /text-zinc-300/g, replacement: 'text-slate-600' },
  { regex: /text-zinc-400/g, replacement: 'text-slate-600' },
  { regex: /text-zinc-500/g, replacement: 'text-slate-500' },
  { regex: /text-zinc-600/g, replacement: 'text-slate-500' },
  { regex: /text-zinc-700/g, replacement: 'text-slate-400' },
  { regex: /text-zinc-950/g, replacement: 'text-white' },

  { regex: /placeholder-zinc-700/g, replacement: 'placeholder-slate-400' },

  { regex: /text-teal-400/g, replacement: 'text-blue-600' },
  { regex: /text-teal-500/g, replacement: 'text-blue-600' },
  { regex: /text-teal-300/g, replacement: 'text-blue-500' },
  { regex: /bg-teal-500\/5/g, replacement: 'bg-blue-50' },
  { regex: /bg-teal-500\/10/g, replacement: 'bg-blue-50' },
  { regex: /bg-teal-500\/15/g, replacement: 'bg-blue-50' },
  { regex: /bg-teal-500\/20/g, replacement: 'bg-blue-50' },
  { regex: /bg-teal-950\/5/g, replacement: 'bg-blue-50' },
  { regex: /bg-teal-500/g, replacement: 'bg-blue-600' },
  { regex: /hover:bg-teal-400/g, replacement: 'hover:bg-blue-500' },
  { regex: /hover:bg-teal-500\/20/g, replacement: 'hover:bg-blue-100' },
  { regex: /border-teal-500\/10/g, replacement: 'border-blue-200' },
  { regex: /border-teal-500\/30/g, replacement: 'border-blue-200' },
  { regex: /border-teal-500/g, replacement: 'border-blue-500' },
  { regex: /focus:border-teal-500/g, replacement: 'focus:border-blue-500' },
  { regex: /shadow-teal-500\/10/g, replacement: 'shadow-blue-500/20' },
  { regex: /shadow-teal-500\/15/g, replacement: 'shadow-blue-500/20' },
  { regex: /shadow-teal-500\/20/g, replacement: 'shadow-blue-500/20' },

  { regex: /bg-emerald-500\/10/g, replacement: 'bg-emerald-50' },
  { regex: /border-emerald-500\/20/g, replacement: 'border-emerald-200' },
  { regex: /border-emerald-500\/30/g, replacement: 'border-emerald-200' },
  { regex: /bg-emerald-950\/20/g, replacement: 'bg-emerald-50' },
  { regex: /text-emerald-400/g, replacement: 'text-emerald-600' },
  
  { regex: /bg-red-500\/10/g, replacement: 'bg-red-50' },
  { regex: /bg-red-500\/15/g, replacement: 'bg-red-50' },
  { regex: /bg-red-950\/20/g, replacement: 'bg-red-50' },
  { regex: /bg-red-900\/40/g, replacement: 'bg-red-50' },
  { regex: /hover:bg-red-500\/10/g, replacement: 'hover:bg-red-100' },
  { regex: /hover:bg-red-900\/40/g, replacement: 'hover:bg-red-100' },
  { regex: /border-red-500\/20/g, replacement: 'border-red-200' },
  { regex: /border-red-500\/30/g, replacement: 'border-red-200' },
  { regex: /text-red-400/g, replacement: 'text-red-600' },

  { regex: /bg-amber-500\/10/g, replacement: 'bg-amber-50' },
  { regex: /bg-amber-500\/15/g, replacement: 'bg-amber-50' },
  { regex: /border-amber-500\/30/g, replacement: 'border-amber-200' },
  { regex: /text-amber-400/g, replacement: 'text-amber-600' },
  { regex: /text-amber-300/g, replacement: 'text-amber-600' },

  { regex: /bg-purple-500\/10/g, replacement: 'bg-purple-50' },
  { regex: /bg-purple-500\/15/g, replacement: 'bg-purple-50' },
  { regex: /border-purple-500\/20/g, replacement: 'border-purple-200' },
  { regex: /text-purple-300/g, replacement: 'text-purple-600' },
  { regex: /text-purple-400/g, replacement: 'text-purple-600' },

  { regex: /bg-rose-500\/10/g, replacement: 'bg-rose-50' },
  { regex: /text-rose-300/g, replacement: 'text-rose-600' },
  
  // Custom specific
  { regex: /hover:text-white/g, replacement: 'hover:text-blue-600' }
];

directories.forEach(dir => {
  const filePath = path.join(__dirname, 'src', 'app', dir, 'page.js');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    replacements.forEach(({ regex, replacement }) => {
      content = content.replace(regex, replacement);
    });

    // Handle any missed text-white inside inputs or select
    content = content.replace(/text-white text-xs/g, 'text-slate-800 text-xs');
    content = content.replace(/text-white text-sm/g, 'text-slate-800 text-sm');

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
