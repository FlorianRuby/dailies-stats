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

    // Initialize both global and personal charts
    await Promise.all([
        initializeCharts(),
        initializePersonalCharts()
    ]);
});

// Add any leaderboard-specific functionality here
// The main leaderboard functionality is already in app.js 

async function initializeCharts() {
    const { data: scores, error } = await supabase
        .from('scores')
        .select(`
            game,
            score,
            created_at,
            users (
                username
            )
        `)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching data for charts:', error);
        return;
    }

    // Process data for charts
    const processedData = processChartData(scores);
    
    // Create all charts
    createDailySubmissionsChart(processedData.dailySubmissions);
    createPopularGamesChart(processedData.gamePopularity);
    createPerformanceChart(processedData.averagePerformance);
    createActivePlayersChart(processedData.activePlayers);
}

function processChartData(scores) {
    // Group submissions by date
    const dailySubmissions = {};
    const gamePopularity = {};
    const performanceByGame = {};
    const playersByDate = {};

    scores.forEach(score => {
        // Process daily submissions
        const date = new Date(score.created_at).toLocaleDateString();
        dailySubmissions[date] = (dailySubmissions[date] || 0) + 1;

        // Process game popularity
        gamePopularity[score.game] = (gamePopularity[score.game] || 0) + 1;

        // Process performance by game
        if (!performanceByGame[score.game]) {
            performanceByGame[score.game] = {
                total: 0,
                count: 0
            };
        }
        performanceByGame[score.game].total += calculateGamePerformance(score.game, score.score);
        performanceByGame[score.game].count++;

        // Process active players
        if (!playersByDate[date]) {
            playersByDate[date] = new Set();
        }
        playersByDate[date].add(score.users.username);
    });

    return {
        dailySubmissions,
        gamePopularity,
        averagePerformance: Object.entries(performanceByGame).map(([game, data]) => ({
            game,
            average: data.total / data.count
        })),
        activePlayers: Object.entries(playersByDate).map(([date, players]) => ({
            date,
            count: players.size
        }))
    };
}

function createDailySubmissionsChart(data) {
    const ctx = document.getElementById('dailySubmissionsChart');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(data).slice(-14), // Last 14 days
            datasets: [{
                label: 'Daily Submissions',
                data: Object.values(data).slice(-14),
                borderColor: '#7757AB',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(119, 87, 171, 0.1)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(119, 87, 171, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function createPopularGamesChart(data) {
    const ctx = document.getElementById('popularGamesChart');
    const sortedData = Object.entries(data)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sortedData.map(([game]) => formatGameName(game)),
            datasets: [{
                data: sortedData.map(([,count]) => count),
                backgroundColor: [
                    '#7757AB',
                    '#9779C3',
                    '#B69BD9',
                    '#D4BDEF',
                    '#F2DFF5'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function createPerformanceChart(data) {
    const ctx = document.getElementById('performanceChart');
    const sortedData = data.sort((a, b) => b.average - a.average).slice(0, 8);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(item => formatGameName(item.game)),
            datasets: [{
                label: 'Average Performance',
                data: sortedData.map(item => item.average.toFixed(1)),
                backgroundColor: '#7757AB'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(119, 87, 171, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function createActivePlayersChart(data) {
    const ctx = document.getElementById('activePlayersChart');
    const sortedData = data.slice(-14); // Last 14 days

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedData.map(item => item.date),
            datasets: [{
                label: 'Active Players',
                data: sortedData.map(item => item.count),
                borderColor: '#7757AB',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(119, 87, 171, 0.1)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(119, 87, 171, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

async function initializePersonalCharts() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        document.getElementById('personal-analytics').classList.add('hidden');
        return;
    }

    document.getElementById('personal-analytics').classList.remove('hidden');

    const { data: scores, error } = await supabase
        .from('scores')
        .select('game, score, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching personal data:', error);
        return;
    }

    const processedData = processPersonalData(scores);
    
    createPersonalActivityChart(processedData.dailyActivity);
    createPersonalGamesChart(processedData.favoriteGames);
    createPersonalPerformanceChart(processedData.performanceTrend);
    createGamesPerDayChart(processedData.gamesPerDay);
    updateGamesPerDayStats(processedData.averageGamesPerDay);
}

function processPersonalData(scores) {
    const dailyActivity = {};
    const gameCount = {};
    const performanceByDate = {};
    const gamesPerDay = {};
    
    // Calculate date range
    const firstGame = scores.length > 0 ? new Date(scores[0].created_at) : new Date();
    const lastGame = scores.length > 0 ? new Date(scores[scores.length - 1].created_at) : new Date();
    const daysSinceStart = Math.max(1, Math.ceil((lastGame - firstGame) / (1000 * 60 * 60 * 24)));

    scores.forEach(score => {
        const date = new Date(score.created_at).toLocaleDateString();
        
        // Daily activity
        dailyActivity[date] = (dailyActivity[date] || 0) + 1;
        
        // Favorite games
        gameCount[score.game] = (gameCount[score.game] || 0) + 1;
        
        // Performance trend
        if (!performanceByDate[date]) {
            performanceByDate[date] = {
                total: 0,
                count: 0
            };
        }
        performanceByDate[date].total += calculateGamePerformance(score.game, score.score);
        performanceByDate[date].count++;

        // Games per day tracking
        gamesPerDay[date] = (gamesPerDay[date] || 0) + 1;
    });

    // Calculate average games per day
    const totalGames = scores.length;
    const averageGamesPerDay = (totalGames / daysSinceStart).toFixed(1);

    return {
        dailyActivity,
        favoriteGames: gameCount,
        performanceTrend: performanceByDate,
        gamesPerDay,
        averageGamesPerDay
    };
}

function createPersonalActivityChart(data) {
    const ctx = document.getElementById('personalActivityChart');
    const last14Days = Object.entries(data)
        .slice(-14)
        .map(([date, count]) => ({ date, count }));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last14Days.map(d => d.date),
            datasets: [{
                label: 'Games Played',
                data: last14Days.map(d => d.count),
                backgroundColor: '#7757AB'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function createPersonalGamesChart(data) {
    const ctx = document.getElementById('personalGamesChart');
    const sortedGames = Object.entries(data)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: sortedGames.map(([game]) => formatGameName(game)),
            datasets: [{
                data: sortedGames.map(([,count]) => count),
                backgroundColor: [
                    '#7757AB',
                    '#9779C3',
                    '#B69BD9',
                    '#D4BDEF',
                    '#F2DFF5'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function createPersonalPerformanceChart(data) {
    const ctx = document.getElementById('personalPerformanceChart');
    const last14Days = Object.entries(data)
        .slice(-14)
        .map(([date, stats]) => ({
            date,
            performance: stats.total / stats.count
        }));

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: last14Days.map(d => d.date),
            datasets: [{
                label: 'Average Performance',
                data: last14Days.map(d => d.performance.toFixed(1)),
                borderColor: '#7757AB',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function createGamesPerDayChart(data) {
    const ctx = document.getElementById('gamesPerDayChart');
    const last7Days = Object.entries(data)
        .slice(-7)
        .map(([date, count]) => ({ date, count }));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7Days.map(d => d.date),
            datasets: [{
                label: 'Games per Day',
                data: last7Days.map(d => d.count),
                backgroundColor: '#7757AB'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function updateGamesPerDayStats(average) {
    const gamesPerDayElement = document.getElementById('gamesPerDay');
    if (gamesPerDayElement) {
        gamesPerDayElement.textContent = average;
    }
}

function renderLeaderboard(data) {
    const leaderboardContent = document.getElementById('leaderboard-content');
    
    // Clear previous content
    leaderboardContent.innerHTML = '';
    
    // Create table container for horizontal scrolling on mobile
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    
    // Create table
    const table = document.createElement('table');
    table.id = 'leaderboard-table';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Add header cells
    const headers = ['Rank', 'Player', 'Average Performance'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    // Add data rows
    data.forEach((player, index) => {
        const row = document.createElement('tr');
        
        // Rank cell
        const rankCell = document.createElement('td');
        rankCell.textContent = index + 1;
        row.appendChild(rankCell);
        
        // Player cell with avatar
        const playerCell = document.createElement('td');
        playerCell.className = 'player-cell';
        
        const avatar = document.createElement('img');
        avatar.src = player.avatar_url || 'default-avatar.png';
        avatar.alt = 'Avatar';
        avatar.className = 'leaderboard-avatar';
        
        const playerName = document.createElement('span');
        playerName.textContent = player.username;
        
        playerCell.appendChild(avatar);
        playerCell.appendChild(playerName);
        row.appendChild(playerCell);
        
        // Score cell
        const scoreCell = document.createElement('td');
        scoreCell.textContent = player.score + '%';
        row.appendChild(scoreCell);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    leaderboardContent.appendChild(tableContainer);
} 