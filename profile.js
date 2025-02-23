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
    const profilePicture = document.getElementById('profile-picture')
    const changePictureBtn = document.getElementById('change-picture-btn')
    const pictureUpload = document.getElementById('picture-upload')

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
        loadProfilePicture()
    }

    async function loadProfileData(user) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('username, email')
                .eq('id', user.id)
                .single();
            
            if (error) throw error;
            
            // Update username without "Hi" prefix
            userUsername.textContent = data.username;
            userEmail.textContent = data.email;
        } catch (error) {
            console.error('Error loading profile data:', error);
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
            await displayStats(stats)
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
            case 'waffle':
                if (score === 0) return 'X/5'
                return score + '/5'
            case 'angle':
                return score + '%'
            case 'minecraftle':
                return score + '/10'
            case 'travle':
                return '+' + (score - 1)
            case 'whentaken':
                return Math.round(score * 10) + '/1000'
            case 'geogrid':
                return Math.round((100 - score) * 10) + '/1000'
            case 'foodguessr':
                const originalScore = Math.round((score / 100) * 15000);
                return `${originalScore.toLocaleString()}/15,000`
            case 'globle':
                return score + '/10'
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
            case 'waffle':
                return '🧇 Waffle'
            case 'globle':
                return '🌍 Globle'
            default:
                return game.charAt(0).toUpperCase() + game.slice(1)
        }
    }

    // Add new function for plain game names without emojis
    function formatGameNamePlain(game) {
        switch(game) {
            case 'wordle':
                return 'Wordle'
            case 'worldle':
                return 'Worldle'
            case 'flagle':
                return 'Flagle'
            case 'angle':
                return 'Angle'
            case 'minecraftle':
                return 'Minecraftle'
            case 'travle':
                return 'Travle'
            case 'whentaken':
                return 'WhenTaken'
            case 'wheretaken':
                return 'WhereTaken'
            case 'wheretaken-us':
                return 'WhereTaken US'
            case 'geogrid':
                return 'GeoGrid'
            case 'foodguessr':
                return 'FoodGuessr'
            case 'waffle':
                return 'Waffle'
            case 'globle':
                return 'Globle'
            default:
                return game.charAt(0).toUpperCase() + game.slice(1)
        }
    }

    async function calculateGeneralStats(stats) {
        let totalGames = 0;
        let totalScore = 0;
        let gamesPlayed = new Set();
        
        // Get user's registration date
        const { data: { user } } = await supabase.auth.getUser();
        const { data: userData } = await supabase
            .from('users')
            .select('created_at')
            .eq('id', user.id)
            .single();
        
        // Calculate days since registration
        const registrationDate = new Date(userData.created_at);
        const today = new Date();
        const daysSinceRegistration = Math.ceil((today - registrationDate) / (1000 * 60 * 60 * 24)) + 1;  // Always add 1 day
        
        Object.entries(stats).forEach(([game, stat]) => {
            totalGames += stat.count;
            gamesPlayed.add(game);
            
            // Calculate performance percentage based on game type
            let gamePerf = 0;
            if (game === 'angle' || game === 'whentaken' || game === 'geogrid' || game === 'foodguessr') {
                // These games already store percentage scores
                gamePerf = stat.total / stat.count;
            } else if (game === 'waffle') {
                // Waffle is out of 5
                gamePerf = (stat.total / (stat.count * 5)) * 100;
            } else if (game === 'minecraftle') {
                // Minecraftle conversion
                const mcScoreToPercent = score => {
                    const scoreMap = { 1: 100, 2: 83, 3: 67, 4: 50, 5: 33, 6: 17, 11: 0 };
                    return scoreMap[score] || 0;
                };
                gamePerf = mcScoreToPercent(stat.total / stat.count);
            } else if (game === 'travle') {
                // Travle conversion
                const travleToPercent = score => {
                    const scoreMap = { 1: 100, 2: 83, 3: 67, 4: 50, 5: 33, 6: 17, 7: 8, 11: 0 };
                    return scoreMap[score] || 0;
                };
                gamePerf = travleToPercent(stat.total / stat.count);
            } else {
                // Standard 6-attempt games (Wordle, Worldle, Flagle)
                gamePerf = ((7 - (stat.total / stat.count)) / 6) * 100;
            }
            totalScore += gamePerf;
        });

        const avgPerformance = totalScore / gamesPlayed.size;
        const gamesPerDay = (totalGames / daysSinceRegistration).toFixed(1);

        return {
            avgPerformance: Math.min(100, Math.round(avgPerformance)),
            gamesPlayed: totalGames,
            gamesPerDay: gamesPerDay
        };
    }

    async function displayStats(stats) {
        if (!statsContainer) return;

        // Calculate general stats
        const generalStats = await calculateGeneralStats(stats);
        
        // Clear container
        statsContainer.innerHTML = '';
        
        // Add general stats card
        const generalStatsCard = document.createElement('div');
        generalStatsCard.className = 'general-stats-card';
        generalStatsCard.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${generalStats.avgPerformance}%</div>
                <div class="stat-label">Avg Performance</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${generalStats.gamesPlayed}</div>
                <div class="stat-label">Games Played</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${generalStats.gamesPerDay}</div>
                <div class="stat-label">Games/Day</div>
            </div>
        `;
        statsContainer.appendChild(generalStatsCard);
        
        // Define all available games
        const allGames = [
            'wordle',
            'worldle',
            'flagle',
            'angle',
            'minecraftle',
            'travle',
            'whentaken',
            'wheretaken',
            'wheretaken-us',
            'geogrid',
            'foodguessr',
            'waffle',
            'globle'
        ];

        // Add game-specific stats for all games
        allGames.forEach(game => {
            const gameStat = stats[game] || { total: 0, count: 0, best: Infinity };
            const avgPercentage = calculateGamePercentage(game, gameStat);
            const bestPercentage = calculateGamePercentage(game, { ...gameStat, count: 1, total: gameStat.best });

            const gameCard = document.createElement('div');
            gameCard.className = 'game-stat';
            gameCard.innerHTML = `
                <h4>${formatGameName(game)}</h4>
                <p>Average: ${gameStat.count ? (gameStat.total / gameStat.count).toFixed(2) : 'N/A'} (${gameStat.count ? Math.round(avgPercentage) : 0}%)</p>
                <p>Best: ${gameStat.best === Infinity ? 'N/A' : gameStat.best} (${gameStat.best === Infinity ? 0 : Math.round(bestPercentage)}%)</p>
                <p>Games: ${gameStat.count}</p>
            `;
            statsContainer.appendChild(gameCard);
        });

        // Initialize glow effects after new cards are added
        initializeGlowEffects();
    }

    // Helper function to calculate game percentage
    function calculateGamePercentage(game, stat) {
        if (stat.count === 0) return 0;
        
        if (game === 'angle' || game === 'whentaken' || game === 'geogrid' || game === 'foodguessr') {
            return stat.total / stat.count;
        } else if (game === 'waffle') {
            return (stat.total / (stat.count * 5)) * 100;
        } else if (game === 'minecraftle') {
            const mcScoreToPercent = score => {
                const scoreMap = { 1: 100, 2: 83, 3: 67, 4: 50, 5: 33, 6: 17, 11: 0 };
                return scoreMap[score] || 0;
            };
            return mcScoreToPercent(stat.total / stat.count);
        } else if (game === 'travle') {
            const travleToPercent = score => {
                const scoreMap = { 1: 100, 2: 83, 3: 67, 4: 50, 5: 33, 6: 17, 7: 8, 11: 0 };
                return scoreMap[score] || 0;
            };
            return travleToPercent(stat.total / stat.count);
        } else {
            return ((7 - (stat.total / stat.count)) / 6) * 100;
        }
    }

    function displayHistory(history) {
        if (!historyContainer) return;
        
        // Group entries by date
        const groupedHistory = history.reduce((groups, entry) => {
            const date = entry.date;
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(entry);
            return groups;
        }, {});

        // Convert to HTML
        historyContainer.innerHTML = Object.entries(groupedHistory)
            .map(([date, entries]) => `
                <div class="history-date-group">
                    <div class="history-date-header">${formatDate(date)}</div>
                    ${entries.map(entry => `
                        <div class="history-entry">
                            <div class="game-name">
                                <span class="game-icon">${getGameIcon(entry.game)}</span>
                                ${formatGameNamePlain(entry.game)}
                            </div>
                            <span class="score">${formatScoreForDisplay(entry.game, entry.score)}</span>
                        </div>
                    `).join('')}
                </div>
            `).join('');
    }

    function getGameIcon(game) {
        const icons = {
            'wordle': '📝',
            'worldle': '🌍',
            'flagle': '🎌',
            'travle': '✈️',
            'whentaken': '📅',
            'wheretaken': '🌎',
            'wheretaken-us': '🦅',
            'geogrid': '🗺️',
            'angle': '📐',
            'minecraftle': '⛏️',
            'foodguessr': '🍽️',
            'waffle': '🧇',
            'globle': '🌍',
        };
        return icons[game] || '🎮';
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
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

    // Load existing profile picture
    async function loadProfilePicture() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from('users')
                .select('avatar_url')
                .eq('id', user.id)
                .single();
            
            if (error) throw error;
            
            // Set the profile picture source with fallback
            profilePicture.src = data?.avatar_url || './assets/default_user_avatar.jpg';
            
        } catch (error) {
            console.error('Error loading profile picture:', error);
            // Set default avatar on error
            profilePicture.src = './assets/default_user_avatar.jpg';
        }
    }

    // Handle picture upload
    changePictureBtn.addEventListener('click', () => {
        pictureUpload.click();
    });

    pictureUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            // Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const { data, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl }, error: urlError } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            if (urlError) throw urlError;

            // Update user profile
            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Update UI
            profilePicture.src = publicUrl;
            alert('Profile picture updated successfully!');

        } catch (error) {
            console.error('Error updating profile picture:', error);
            alert('Error updating profile picture: ' + error.message);
        }
    });

    // Load profile picture on page load
    loadProfilePicture();

    function initializeGlowEffects() {
        // Initialize for stats cards
        const cards = document.querySelectorAll('.game-stat, .general-stats-card');
        
        // Initialize for history entries
        const historyEntries = document.querySelectorAll('.history-entry');
        
        // Combine both selections for initialization
        const elements = [...cards, ...historyEntries];
        
        elements.forEach(element => {
            // Create glow element
            const glow = document.createElement('div');
            glow.className = 'glow-effect';
            element.appendChild(glow);

            // Add mousemove listener
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const glow = element.querySelector('.glow-effect');
                glow.style.left = x + 'px';
                glow.style.top = y + 'px';
                glow.style.opacity = '1';
            });

            // Add mouseleave listener
            element.addEventListener('mouseleave', () => {
                const glow = element.querySelector('.glow-effect');
                glow.style.opacity = '0';
            });
        });
    }

    // Add this to your DOMContentLoaded event listener
    if (statsContainer) {
        // Initialize glow effects after stats are displayed
        initializeGlowEffects();
    }
}) 