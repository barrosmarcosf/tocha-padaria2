window.InstagramModule = {
    init(igConfig) {
        if (!igConfig) return;
        
        const eyebrow = document.querySelector('.instagram-section h2');
        const title = document.querySelector('.instagram-section h3');
        const desc = document.querySelector('.instagram-section .ig-sub');
        const cta = document.querySelector('.instagram-section .ig-cta');

        if (eyebrow) eyebrow.textContent = igConfig.hashtag || '#TochaPadaria';
        if (title) title.innerHTML = (igConfig.title || 'Siga Nossa<br>Jornada').replace(/\n/g, '<br>');
        if (desc) desc.textContent = igConfig.description || 'Acompanhe os bastidores, as novas fornadas e o dia a dia da nossa produção artesanal.';
        if (cta && igConfig.url) cta.href = igConfig.url;
    }
};
