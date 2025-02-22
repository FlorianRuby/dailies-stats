// Profile page specific functionality
document.addEventListener('DOMContentLoaded', async () => {
    const profileSection = document.getElementById('profile-section')
    const loginPrompt = document.getElementById('login-prompt')
    const logoutBtn = document.getElementById('logout-btn')
    const userEmail = document.getElementById('user-email')
    const userUsername = document.getElementById('user-username')
    const editUsernameBtn = document.getElementById('edit-username-btn')
    const statsContainer = document.getElementById('stats-container')
    const historyContainer = document.getElementById('history-container')

    // Add logout handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const { error } = await supabase.auth.signOut()
                if (error) throw error
                window.location.href = 'index.html'
            } catch (error) {
                console.error('Logout error:', error)
                alert('Error logging out: ' + error.message)
            }
        })
    }

    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        profileSection.classList.add('hidden')
        loginPrompt.classList.remove('hidden')
    } else {
        profileSection.classList.remove('hidden')
        loginPrompt.classList.add('hidden')
        loadProfileData(session.user)
        loadUserStats(session.user.id)
        loadUserHistory(session.user.id)
    }

    async function loadProfileData(user) {
        if (userEmail) userEmail.textContent = user.email
        
        try {
            const { data, error } = await supabase
                .from('users')
                .select('username')
                .eq('id', user.id)
                .single()
            
            if (error) throw error
            if (userUsername) userUsername.textContent = data.username
        } catch (error) {
            console.error('Error loading profile:', error)
        }
    }

    async function loadUserStats(userId) {
        try {
            const { data, error } = await supabase
                .from('scores')
                .select('game, score')
                .eq('user_id', userId)
            
            if (error) throw error
            
            // Process and display stats
            const stats = processStats(data)
            displayStats(stats)
        } catch (error) {
            console.error('Error loading stats:', error)
        }
    }

    async function loadUserHistory(userId) {
        try {
            const { data, error } = await supabase
                .from('scores')
                .select(`
                    game,
                    score,
                    date,
                    created_at
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10)
            
            if (error) throw error
            
            displayHistory(data)
        } catch (error) {
            console.error('Error loading history:', error)
        }
    }

    function processStats(scores) {
        const stats = {}
        scores.forEach(score => {
            if (!stats[score.game]) {
                stats[score.game] = {
                    total: 0,
                    count: 0,
                    best: Infinity
                }
            }
            stats[score.game].total += score.score
            stats[score.game].count++
            stats[score.game].best = Math.min(stats[score.game].best, score.score)
        })
        return stats
    }

    function formatScoreForDisplay(game, score) {
        if (score === 11) return 'X'
        
        switch(game) {
            case 'angle':
                return score + '%'
            case 'minecraftle':
                return score + '/6'
            case 'travle':
                return '+' + (score - 1)
            case 'whentaken':
                return Math.round(score * 10) + '/1000'
            case 'geogrid':
                return Math.round((100 - score) * 10) + '/1000'
            case 'foodguessr':
                // Convert percentage back to original score
                const originalScore = Math.round((score / 100) * 15000);
                return `${originalScore.toLocaleString()}/15,000`
            default:
                return score + '/6'
        }
    }

    // Add new function to format game names with icons
    function formatGameName(game) {
        switch(game) {
            case 'wordle':
                return '📝 Wordle'
            case 'worldle':
                return '🌍 Worldle'
            case 'flagle':
                return '🎌 Flagle'
            case 'angle':
                return '📐 Angle'
            case 'minecraftle':
                return '⛏️ Minecraftle'
            case 'travle':
                return '✈️ Travle'
            case 'whentaken':
                return '📅 WhenTaken'
            case 'wheretaken':
                return '🌎 WhereTaken'
            case 'wheretaken-us':
                return '🦅 WhereTaken US'
            case 'geogrid':
                return '🗺️ GeoGrid'
            case 'foodguessr':
                return '🍽️ FoodGuessr'
            default:
                return game.charAt(0).toUpperCase() + game.slice(1)
        }
    }

    function displayStats(stats) {
        if (!statsContainer) return
        statsContainer.innerHTML = Object.entries(stats)
            .map(([game, stat]) => `
                <div class="game-stat">
                    <h4>${formatGameName(game)}</h4>
                    <p>Average: ${(stat.total / stat.count).toFixed(2)}</p>
                    <p>Best: ${stat.best === Infinity ? 'N/A' : stat.best}</p>
                    <p>Games: ${stat.count}</p>
                </div>
            `).join('')
    }

    function displayHistory(history) {
        if (!historyContainer) return
        historyContainer.innerHTML = history.length ? history
            .map(entry => {
                let displayScore = formatScoreForDisplay(entry.game, entry.score)
                return `
                    <div class="history-entry">
                        <p>${formatGameName(entry.game)}: ${displayScore}</p>
                        <p class="history-date">${new Date(entry.date).toLocaleDateString()}</p>
                    </div>
                `
            }).join('') : '<p>No recent submissions</p>'
    }

    // Event listeners
    if (editUsernameBtn) {
        editUsernameBtn.addEventListener('click', async () => {
            const newUsername = prompt('Enter new username:')
            if (newUsername) {
                try {
                    const { data: { user } } = await supabase.auth.getUser()
                    const { error } = await supabase
                        .from('users')
                        .update({ username: newUsername })
                        .eq('id', user.id)
                    
                    if (error) throw error
                    if (userUsername) userUsername.textContent = newUsername
                    alert('Username updated successfully!')
                } catch (error) {
                    alert('Error updating username: ' + error.message)
                }
            }
        })
    }
}) 