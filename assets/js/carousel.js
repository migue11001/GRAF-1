document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.sponsors-track');
    if (!track) return;

    const originalHTML = track.innerHTML;

    // Render once to measure real item widths
    requestAnimationFrame(() => {
        let originalWidth = 0;
        Array.from(track.children).forEach(item => {
            originalWidth += item.getBoundingClientRect().width;
        });

        // Duplicate enough times so total width >= originalWidth + screenWidth
        // This ensures there's always visible content during the animation reset
        const screenWidth = window.innerWidth;
        const copiesNeeded = Math.ceil((originalWidth + screenWidth * 2) / originalWidth);

        let repeated = '';
        for (let i = 0; i < copiesNeeded; i++) {
            repeated += originalHTML;
        }
        track.innerHTML = originalHTML + repeated;

        // Animate exactly one set width — seamless because position 0 === position originalWidth visually
        const style = document.createElement('style');
        style.textContent = `
            @keyframes scroll-sponsors {
                from { transform: translateX(0); }
                to   { transform: translateX(-${originalWidth}px); }
            }
        `;
        document.head.appendChild(style);

        const speed = 60; // px per second
        track.style.animationDuration = (originalWidth / speed) + 's';
        track.style.animationTimingFunction = 'linear';
        track.style.animationIterationCount = 'infinite';
    });
});
