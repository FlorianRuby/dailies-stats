document.addEventListener('DOMContentLoaded', () => {
    const gameSelect = document.getElementById('game-select')
    const timePeriod = document.getElementById('time-period')

    // Add event listeners for filters
    gameSelect.addEventListener('change', updateLeaderboard)
    timePeriod.addEventListener('change', updateLeaderboard)

    // Initial load of leaderboard
    updateLeaderboard()
})

// Add any leaderboard-specific functionality here
// The main leaderboard functionality is already in app.js 