#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../public/admin/index.html');
const v = Date.now();

let html = fs.readFileSync(indexPath, 'utf8');

// Replace existing ?v=... or add ?v=<build_id> before the closing quote on each asset
html = html
  .replace(/(\/admin\/dist\/[^"?]+)(\?v=\d+)?(")/g, `$1?v=${v}$3`)
  .replace(/(\/admin\/styles[^"?]*\.css)(\?v=\d+)?(")/g, `$1?v=${v}$3`);

fs.writeFileSync(indexPath, html, 'utf8');
console.log(`[inject-version] v=${v} → public/admin/index.html`);
