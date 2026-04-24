window.FoodserviceModule = {
    init(foodserviceConfig) {
        if (!foodserviceConfig) return;
        
        const eyebrow = document.querySelector('.foodservice-section .feat-eyebrow');
        const title = document.querySelector('.foodservice-section h2');
        const desc = document.querySelector('.foodservice-section .food-desc');
        const grid = document.querySelector('.food-image-grid');

        if (eyebrow) eyebrow.textContent = foodserviceConfig.eyebrow;
        if (title) title.textContent = foodserviceConfig.title;
        if (desc) desc.textContent = foodserviceConfig.description;

        if (grid && foodserviceConfig.images && foodserviceConfig.images.length > 0) {
            grid.innerHTML = '';
            foodserviceConfig.images.forEach(imgUrl => {
                const imgPath = imgUrl.startsWith('http') ? imgUrl : '/' + imgUrl;
                const item = document.createElement('div');
                item.className = 'food-grid-item reveal';
                item.innerHTML = `<img src="${imgPath}" alt="Foodservice" loading="lazy">`;
                grid.appendChild(item);
            });
        }
    }
};
