window.FooterModule = {
    init(footerConfig, storeInfo) {
        if (!footerConfig) return;
        
        const desc = document.getElementById('dyn-footer-desc');
        const credits = document.getElementById('dyn-footer-credits');
        const logo = document.getElementById('site-logo-footer');

        if (desc) desc.textContent = footerConfig.description;
        if (credits) credits.innerHTML = footerConfig.credits.replace(/\n/g, '<br>');
        
        if (storeInfo && storeInfo.logo_url && logo) {
            logo.src = storeInfo.logo_url;
        }
    }
};
