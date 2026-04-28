window.InstagramModule = {
    init(igConfig) {
        if (!igConfig) return;
        
        const eyebrow = document.querySelector('.nos-acompanhe .subtitle');
        const title = document.querySelector('.nos-acompanhe h1');
        const desc = document.querySelector('.nos-acompanhe p');
        const cta = document.querySelector('.nos-acompanhe .btn');

        if (eyebrow) eyebrow.textContent = igConfig.hashtag || '#TochaPadaria';
        if (title) title.innerHTML = (igConfig.title || 'Siga Nossa<br>Jornada').replace(/\n/g, '<br>');
        if (desc) desc.textContent = igConfig.description || 'Acompanhe os bastidores, as novas fornadas e o dia a dia da nossa produção artesanal.';
        if (cta && igConfig.url) cta.href = igConfig.url;
    }
};
