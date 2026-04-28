const fs = require('fs');
const path = require('path');

const files = ['sourdough.html', 'doces.html', 'tortas.html'];
const publicDir = path.join(__dirname, 'public');

for (const file of files) {
    const filePath = path.join(publicDir, file);
    if (!fs.existsSync(filePath)) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');

    // Add icon to entrega span
    content = content.replace(/<span class="entrega">/g, `<span class="entrega"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px; vertical-align:text-bottom"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`);

    // Replace COMPRAR AGORA button and add preco-row
    content = content.replace(/<div class="preco">(.*?)<\/div>\s*<button>COMPRAR AGORA<\/button>/g, 
        `<div class="preco-row">
                        <div class="preco">$1</div>
                        <div class="qtd-selector">
                            <button>-</button>
                            <span>1</span>
                            <button>+</button>
                        </div>
                    </div>
                    <button class="btn-comprar">COMPRAR AGORA</button>`);

    // Replace ESGOTADO button and add preco-row
    content = content.replace(/<div class="preco">(.*?)<\/div>\s*<button disabled>ESGOTADO<\/button>/g, 
        `<div class="preco-row">
                        <div class="preco">$1</div>
                        <div class="qtd-selector">
                            <button disabled>-</button>
                            <span>1</span>
                            <button disabled>+</button>
                        </div>
                    </div>
                    <button class="btn-comprar" disabled>ESGOTADO</button>`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
}
