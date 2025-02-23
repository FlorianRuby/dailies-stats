document.addEventListener('DOMContentLoaded', async () => {
    // Get necessary DOM elements with null checks
    const leaderboardContent = document.getElementById('leaderboard-content');
    const gameSelect = document.getElementById('game-select');

    // Only add event listeners if elements exist
    if (gameSelect) {
        gameSelect.addEventListener('change', () => {
            updateLeaderboard();
        });
    }

    // Initial leaderboard load - with a slight delay to ensure auth is initialized
    setTimeout(() => {
        updateLeaderboard();
    }, 100);
});

// Add any leaderboard-specific functionality here
// The main leaderboard functionality is already in app.js 