document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.sponsors-track');
    if (!track) return;

    const originalItems = track.innerHTML;
    const itemCount = track.children.length;
    const itemWidth = 250;
    const originalWidth = itemCount * itemWidth;
    const screenWidth = window.innerWidth;

    // Duplicate enough times to fill at least 2x the screen
    const copies = Math.ceil(screenWidth / originalWidth) + 1;
    let duplicated = '';
    for (let i = 0; i < copies; i++) {
        duplicated += originalItems;
    }
    track.innerHTML = originalItems + duplicated;

    // Create keyframes dynamically based on actual original width
    const speed = 50;
    const duration = originalWidth / speed;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes scroll-sponsors {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${originalWidth}px); }
        }
    `;
    document.head.appendChild(style);

    track.style.animationDuration = duration + 's';
});
