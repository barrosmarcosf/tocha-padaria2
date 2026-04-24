window.HeroModule = {
    init(heroConfig) {
        if (!heroConfig) return;
        
        const eyebrow = document.getElementById('dyn-hero-eyebrow');
        const title = document.getElementById('dyn-hero-title');
        const desc = document.getElementById('dyn-hero-description');
        const img = document.getElementById('dyn-hero-img');

        if (eyebrow) eyebrow.textContent = heroConfig.eyebrow;
        if (title) title.innerHTML = heroConfig.title.replace(/\n/g, '<br>');
        if (desc) desc.textContent = heroConfig.description;
        if (img) {
            const imgPath = heroConfig.image_url.startsWith('http') ? heroConfig.image_url : '/' + heroConfig.image_url;
            img.src = imgPath;
        }
    }
};
