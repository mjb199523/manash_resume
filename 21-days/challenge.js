/**
 * 21 Days • 21 Games Challenge
 * Dynamic game card renderer and progress tracker.
 * 
 * To add a new game, simply add an entry to the GAMES array below.
 * Everything else (cards, counts, progress bar) updates automatically.
 */

const GAMES = [
    {
        day: 1,
        name: 'Guess the Number',
        status: 'completed',
        playUrl: 'https://mjb199523.github.io/Guess-the-number/',
        repoUrl: 'https://github.com/mjb199523/Guess-the-number'
    },
    {
        day: 2,
        name: 'Stone Paper Blade',
        status: 'completed',
        playUrl: 'https://mjb199523.github.io/stone_paper_blade/',
        repoUrl: 'https://github.com/mjb199523/stone_paper_blade'
    },
    {
        day: 3,
        name: 'Grid Wars',
        status: 'completed',
        playUrl: 'https://mjb199523.github.io/grid_wars/',
        repoUrl: 'https://github.com/mjb199523/grid_wars'
    },
    {
        day: 4,
        name: 'Memory Matrix',
        status: 'completed',
        playUrl: 'https://mjb199523.github.io/memory_matrix/',
        repoUrl: 'https://github.com/mjb199523/memory_matrix'
    },
    {
        day: 5,
        name: 'Neon Snake',
        status: 'completed',
        playUrl: 'https://mjb199523.github.io/neon_snake/',
        repoUrl: 'https://github.com/mjb199523/neon_snake'
    },
    {
        day: 6,
        name: 'Velocity Pong',
        status: 'completed',
        playUrl: 'https://mjb199523.github.io/velocity_pong/',
        repoUrl: 'https://github.com/mjb199523/velocity_pong'
    },
    {
        day: 7,
        name: 'Brick Storm',
        status: 'completed',
        playUrl: 'https://mjb199523.github.io/Brick_Storm/',
        repoUrl: 'https://github.com/mjb199523/Brick_Storm'
    },
    {
        day: 8,
        name: 'Galaxy Defender',
        status: 'completed',
        playUrl: 'https://mjb199523.github.io/galaxy_defender/',
        repoUrl: 'https://github.com/mjb199523/galaxy_defender'
    },
    {
        day: 9,
        name: 'Sling Shot',
        status: 'completed',
        playUrl: 'https://mjb199523.github.io/sling_shot/',
        repoUrl: 'https://github.com/mjb199523/sling_shot'
    },
    {
        day: 10,
        name: 'Kingdom Defense',
        status: 'completed',
        playUrl: 'https://mjb199523.github.io/kingdom_defense/',
        repoUrl: 'https://github.com/mjb199523/Kingdom_Defense'
    },
    { day: 11, name: 'Coming Soon', status: 'coming-soon' },
    { day: 12, name: 'Coming Soon', status: 'coming-soon' },
    { day: 13, name: 'Coming Soon', status: 'coming-soon' },
    { day: 14, name: 'Coming Soon', status: 'coming-soon' },
    { day: 15, name: 'Coming Soon', status: 'coming-soon' },
    { day: 16, name: 'Coming Soon', status: 'coming-soon' },
    { day: 17, name: 'Coming Soon', status: 'coming-soon' },
    { day: 18, name: 'Coming Soon', status: 'coming-soon' },
    { day: 19, name: 'Coming Soon', status: 'coming-soon' },
    { day: 20, name: 'Coming Soon', status: 'coming-soon' },
    { day: 21, name: 'Coming Soon', status: 'coming-soon' }
];

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Feather Icons
    feather.replace();

    // --- Theme Toggle (reuses same system as main site) ---
    const themeBtn = document.getElementById('theme-toggle');
    const root = document.documentElement;

    const savedTheme = localStorage.getItem('theme');
    let isDark = savedTheme === 'dark';

    function applyTheme() {
        root.setAttribute('data-theme', isDark ? 'dark' : 'light');
        if (themeBtn) {
            themeBtn.innerHTML = isDark
                ? '<i data-feather="moon" class="icon-sm"></i>'
                : '<i data-feather="sun" class="icon-sm"></i>';
            feather.replace();
        }
    }

    applyTheme();

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            isDark = !isDark;
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            applyTheme();
        });
    }

    // --- Dynamic Progress ---
    const completedGames = GAMES.filter(g => g.status === 'completed');
    const totalGames = GAMES.length;
    const completedCount = completedGames.length;
    const percentage = Math.round((completedCount / totalGames) * 100);

    // Update progress label
    const progressLabel = document.getElementById('challenge-progress-label');
    if (progressLabel) {
        progressLabel.textContent = `${completedCount}/${totalGames} Completed`;
    }

    // Update progress percentage
    const progressPercent = document.getElementById('challenge-progress-percent');
    if (progressPercent) {
        progressPercent.textContent = `${percentage}%`;
    }

    // Animate progress bar fill
    const progressFill = document.getElementById('challenge-progress-fill');
    if (progressFill) {
        requestAnimationFrame(() => {
            setTimeout(() => {
                progressFill.style.width = `${percentage}%`;
            }, 200);
        });
    }

    // --- Render Game Cards ---
    const gridContainer = document.getElementById('challenge-grid');
    if (!gridContainer) return;

    GAMES.forEach((game, index) => {
        const card = document.createElement('div');
        const isCompleted = game.status === 'completed';
        card.className = `game-card${isCompleted ? '' : ' coming-soon'}`;

        // Staggered entrance animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;

        const statusBadgeClass = isCompleted ? 'completed' : 'coming-soon-badge';
        const statusText = isCompleted ? '✅ Completed' : '🚧 Coming Soon';

        let actionsHTML = '';
        if (isCompleted) {
            actionsHTML = `
                <a href="${game.playUrl}" target="_blank" rel="noopener noreferrer" class="game-btn game-btn-play">
                    <i data-feather="play"></i> Play Game
                </a>
                <a href="${game.repoUrl}" target="_blank" rel="noopener noreferrer" class="game-btn game-btn-github">
                    <i data-feather="github"></i> GitHub
                </a>
            `;
        } else {
            actionsHTML = `
                <button class="game-btn game-btn-disabled" disabled>
                    <i data-feather="lock"></i> Coming Soon
                </button>
            `;
        }

        card.innerHTML = `
            <div class="game-card-header">
                <span class="game-day-badge">Day ${game.day}</span>
                <span class="game-status-badge ${statusBadgeClass}">${statusText}</span>
            </div>
            <h3 class="game-card-name">${game.name}</h3>
            <div class="game-card-actions">
                ${actionsHTML}
            </div>
        `;

        gridContainer.appendChild(card);

        // Trigger entrance animation
        requestAnimationFrame(() => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        });
    });

    // Re-initialize Feather icons for dynamically added cards
    feather.replace();
});
