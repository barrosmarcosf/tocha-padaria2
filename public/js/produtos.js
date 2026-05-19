document.addEventListener('DOMContentLoaded', async () => {
    // Pequeno delay para garantir que o app.js carregou os dados
    setTimeout(() => {
        renderOnlyThumbnails();
    }, 500);

    async function renderOnlyThumbnails() {
        const grid = document.getElementById('thumbnail-grid');
        if (!grid) return;

        // Pegamos os produtos do estado global do app.js
        const state = window.stateData;
        // Se stateData não estiver disponível, esperamos o fetch
        const urlParams = new URLSearchParams(window.location.search);
        const catSlug = urlParams.get('cat');

        const resp = await fetch('/api/config');
        const { categorias, produtos } = await resp.json();

        let filteredItems = produtos || [];
        if (catSlug) {
            filteredItems = filteredItems.filter(p => p.category_slug === catSlug);
            const cat = categorias.find(c => c.slug === catSlug);
            if (cat) document.getElementById('gallery-title').textContent = cat.title;
        }

        grid.innerHTML = '';
        filteredItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'thumbnail-item';
            div.innerHTML = `<img src="${item.image_url}" alt="${item.name}" loading="lazy">`;

            div.addEventListener('click', () => {
                console.log("Selecionado:", item.name);
            });

            grid.appendChild(div);
        });
    }
});
