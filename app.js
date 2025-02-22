// Initialize Supabase client
const supabaseUrl = 'https://tjpyinsvgpcdqbubmscw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcHlpbnN2Z3BjZHFidWJtc2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyMzI4MjEsImV4cCI6MjA1NTgwODgyMX0.pxsU1RyhIMeeFgfGTD13kr_-lakTb_ypgSTMq7gaIYc'
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

// DOM Elements - Add null checks
const loginBtn = document.getElementById('login-btn')
const signupBtn = document.getElementById('signup-btn')
const scoreSubmission = document.getElementById('score-submission')
const leaderboardContent = document.getElementById('leaderboard-content')
const gameSelect = document.getElementById('game-select')
const timePeriod = document.getElementById('time-period')
const loginModal = document.getElementById('login-modal')
const signupModal = document.getElementById('signup-modal')
const loginForm = document.getElementById('login-form')
const signupForm = document.getElementById('signup-form')
const closeButtons = document.querySelectorAll('.close')
const logoutBtn = document.getElementById('logout-btn')
const profileLink = document.getElementById('profile-link')

// Add near the top with other initialization code
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// Initialize UI based on available elements
function initializeUI() {
    // Add this line
    initializeTheme();
    
    // Auth button listeners
    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', () => {
            loginModal.classList.remove('hidden')
        })
    }

    if (signupBtn && signupModal) {
        signupBtn.addEventListener('click', () => {
            signupModal.classList.remove('hidden')
        })
    }

    // Close modal listeners
    if (closeButtons.length > 0) {
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (loginModal) loginModal.classList.add('hidden')
                if (signupModal) signupModal.classList.add('hidden')
            })
        })
    }

    // Form submit listeners
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin)
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup)
    }

    // Game select and time period listeners
    if (gameSelect && timePeriod) {
        gameSelect.addEventListener('change', updateLeaderboard)
        timePeriod.addEventListener('change', updateLeaderboard)
    }

    // Click outside modal listener
    window.addEventListener('click', (e) => {
        if (loginModal && e.target === loginModal) {
            loginModal.classList.add('hidden')
        }
        if (signupModal && e.target === signupModal) {
            signupModal.classList.add('hidden')
        }
    })

    // Add logout button listener
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout)
    }

    // Check initial auth state
    checkInitialAuthState()
}

// Handle login
async function handleLogin(e) {
    e.preventDefault()
    const email = document.getElementById('login-email').value
    const password = document.getElementById('login-password').value
    
    try {
        console.log('Attempting to login...')
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
        
        console.log('Login successful:', data)
        loginModal.classList.add('hidden')
        updateAuthUI(true)
        if (scoreSubmission) showScoreSubmission()
        if (leaderboardContent) updateLeaderboard()
        window.location.href = 'profile.html'
    } catch (error) {
        console.error('Login error:', error)
        alert(error.message)
    }
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault()
    const email = document.getElementById('signup-email').value
    const password = document.getElementById('signup-password').value
    const username = document.getElementById('signup-username').value
    
    try {
        console.log('Attempting to sign up...')
        // First create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        })
        if (authError) throw authError

        console.log('Auth signup successful:', authData)
        
        if (authData.user) {
            // Create user profile
            const { data: userData, error: profileError } = await supabase
                .from('users')
                .insert([{
                    id: authData.user.id,
                    username: username,
                    email: email
                }])
                .select()
                .single()

            if (profileError) {
                console.error('Profile creation error:', profileError)
                throw profileError
            }

            console.log('User profile created:', userData)

            // Auto login
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            })
            if (loginError) throw loginError
        }
        
        if (signupModal) signupModal.classList.add('hidden')
        updateAuthUI(true)
        alert('Signup successful! Redirecting to profile...')
        window.location.href = 'profile.html'
    } catch (error) {
        console.error('Signup error:', error)
        alert(error.message)
    }
}

// Add this function to parse Wordle share text
function parseWordleShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // Try to find the score pattern (e.g., "4/6" or "X/6")
    const scoreMatch = shareText.match(/Wordle \d+,?\d* (\d|X)\/6/);
    if (!scoreMatch) return null;

    // Extract the score number
    const scoreText = scoreMatch[1];
    
    // Return 11 for X (failed attempt) or the actual number
    return scoreText === 'X' ? 11 : parseInt(scoreText);
}

// Add this function after parseWordleShare
function parseWorldleShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // Try to find the score pattern (e.g., "2/6" or "X/6")
    const scoreMatch = shareText.match(/#Worldle #\d+ \(.*?\) (\d|X)\/6/);
    if (!scoreMatch) return null;

    // Extract the score number
    const scoreText = scoreMatch[1];
    
    // Return 11 for X (failed attempt) or the actual number
    return scoreText === 'X' ? 11 : parseInt(scoreText);
}

// Add this function after the other parser functions
function parseFlagleShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // Try to find the score pattern (e.g., "4/6")
    const scoreMatch = shareText.match(/#Flagle #\d+ \(.*?\) (\d|X)\/6/);
    if (!scoreMatch) return null;

    // Extract the score number
    const scoreText = scoreMatch[1];
    
    // Return 11 for X (failed attempt) or the actual number
    return scoreText === 'X' ? 11 : parseInt(scoreText);
}

// Update the Angle parser function
function parseAngleShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // Try to find the score pattern (e.g., "3/4")
    const scoreMatch = shareText.match(/#Angle #\d+ (\d|X)\/4/);
    if (!scoreMatch) return null;

    // Extract the score number
    const scoreText = scoreMatch[1];
    
    if (scoreText === 'X') return 11;
    const originalScore = parseInt(scoreText);
    
    // Convert 1-4 scale to percentage where 1 is best (100%) and 4 is worst (25%)
    const conversionMap = {
        1: 100, // 1/4 -> 100% (best)
        2: 75,  // 2/4 -> 75%
        3: 50,  // 3/4 -> 50%
        4: 25   // 4/4 -> 25% (worst)
    };
    
    return conversionMap[originalScore] || 0;
}

// Add this function after the other parser functions
function parseMinecraftleShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // Try to find the score pattern (e.g., "4/10")
    const scoreMatch = shareText.match(/Minecraftle \d{4}-\d{2}-\d{2} (\d+|X)\/10/);
    if (!scoreMatch) return null;

    // Extract the score number
    const scoreText = scoreMatch[1];
    
    // Return 11 for X (failed attempt) or convert the score
    if (scoreText === 'X') return 11;
    
    const originalScore = parseInt(scoreText);
    
    // Convert 1-10 scale to 1-6 scale
    // 1-2/10 -> 1/6
    // 3-4/10 -> 2/6
    // 5-6/10 -> 3/6
    // 7-8/10 -> 4/6
    // 9/10 -> 5/6
    // 10/10 -> 6/6
    const conversionMap = {
        1: 1, 2: 1,
        3: 2, 4: 2,
        5: 3, 6: 3,
        7: 4, 8: 4,
        9: 5,
        10: 6
    };
    
    return conversionMap[originalScore] || 11;
}

// Add this function after the other parser functions
function parseTravleShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // Try to find the score pattern (e.g., "+1")
    const scoreMatch = shareText.match(/\+(\d+)/);
    if (!scoreMatch) return null;

    const plusScore = parseInt(scoreMatch[1]);
    
    // Convert to 1-11 scale for database:
    // +0 = 1 (best)
    // +1 = 2
    // +2 = 3
    // +3 = 4
    // +4 = 5
    // +5 = 6
    // +6 = 7
    return plusScore >= 7 ? 11 : plusScore + 1;
}

// Add this function after the other parser functions
function parseWhenTakenShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // Try to find the score pattern (e.g., "679/1000")
    const scoreMatch = shareText.match(/I scored (\d+)\/1000/);
    if (!scoreMatch) return null;

    const score = parseInt(scoreMatch[1]);
    
    // Store the actual score as a percentage with one decimal place
    return parseFloat((score / 10).toFixed(1));
}

// Add this function after the other parser functions
function parseWhereTakenUSShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // Try to find the score pattern (e.g., "2/6")
    const scoreMatch = shareText.match(/#WhereTaken🇺🇸 #\d+ \(.*?\) (\d|X)\/6/);
    if (!scoreMatch) return null;

    // Extract the score number
    const scoreText = scoreMatch[1];
    
    // Return 11 for X (failed attempt) or the actual number
    return scoreText === 'X' ? 11 : parseInt(scoreText);
}

// Add this function after the other parser functions
function parseWhereTakenShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // Try to find the score pattern (e.g., "6/6")
    const scoreMatch = shareText.match(/#WhereTaken🌎 #\d+ \(.*?\) (\d|X)\/6/);
    if (!scoreMatch) return null;

    // Extract the score number
    const scoreText = scoreMatch[1];
    
    // Return 11 for X (failed attempt) or the actual number
    return scoreText === 'X' ? 11 : parseInt(scoreText);
}

// Add this function after the other parser functions
function parseGeoGridShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // Try to find the score pattern (e.g., "Score: 455.4")
    const scoreMatch = shareText.match(/Score: (\d+\.?\d*)/);
    if (!scoreMatch) return null;

    // Extract the score
    const score = parseFloat(scoreMatch[1]);
    
    // Convert to percentage (0 is best, 1000 is worst)
    // Store as percentage where higher is better (opposite of raw score)
    return parseFloat((100 - (score / 10)).toFixed(1));
}

// Add the formatGameName function near the top with other utility functions
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

// Update the submitScore function to use the new toast
async function submitScore(game) {
    const scoreInput = document.getElementById(`${game}-score`)
    if (!scoreInput) return
    
    let score;
    
    if (game === 'wordle') {
        const shareText = scoreInput.value.trim();
        score = parseWordleShare(shareText);
        
        if (score === null) {
            alert(`Please enter a valid ${formatGameName(game)} share text`);
            return;
        }
        
        if (score === 11) {
            alert('Score recorded as a failed attempt');
        }
    } else if (game === 'worldle') {
        const shareText = scoreInput.value.trim();
        score = parseWorldleShare(shareText);
        
        if (score === null) {
            alert(`Please enter a valid ${formatGameName(game)} share text`);
            return;
        }
        
        if (score === 11) {
            alert('Score recorded as a failed attempt');
        }
    } else if (game === 'foodguessr') {
        const shareText = scoreInput.value.trim();
        score = parseFoodGuesserShare(shareText);
        
        if (score === null) {
            alert(`Please enter a valid ${formatGameName(game)} share text. Example:
FoodGuessr - 22 Feb 2025 GMT
Round 1 🌕🌕🌗🌑
Round 2 🌕🌕🌕🌘
Round 3 🌕🌕🌕🌖
Total score: 11,500 / 15,000`);
            return;
        }
    } else if (game === 'angle' || game === 'whentaken' || game === 'geogrid') {
        // Group together games that use percentage scores
        const shareText = scoreInput.value.trim();
        score = game === 'angle' ? parseAngleShare(shareText) :
               game === 'whentaken' ? parseWhenTakenShare(shareText) :
               parseGeoGridShare(shareText);
        
        if (score === null) {
            alert(`Please enter a valid ${formatGameName(game)} share text`);
            return;
        }
    } else if (game === 'wordle' || game === 'worldle' || game === 'flagle' || 
               game === 'minecraftle' || game === 'travle' || 
               game === 'wheretaken' || game === 'wheretaken-us') {
        // Group together games that use X/6 or similar scoring
        const shareText = scoreInput.value.trim();
        score = game === 'wordle' ? parseWordleShare(shareText) :
               game === 'worldle' ? parseWorldleShare(shareText) :
               game === 'flagle' ? parseFlagleShare(shareText) :
               game === 'minecraftle' ? parseMinecraftleShare(shareText) :
               game === 'travle' ? parseTravleShare(shareText) :
               game === 'wheretaken' ? parseWhereTakenShare(shareText) :
               parseWhereTakenUSShare(shareText);
        
        if (score === null) {
            alert(`Please enter a valid ${formatGameName(game)} share text`);
            return;
        }
        
        if (score === 11) {
            alert('Score recorded as a failed attempt');
        }
    } else {
        alert(`Invalid game type: ${game}`);
        return;
    }

    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        
        if (!user) {
            alert('Please log in to submit scores')
            return
        }

        // Verify user exists in users table
        const { data: userData, error: profileError } = await supabase
            .from('users')
            .select()
            .eq('id', user.id)
            .single()

        if (profileError || !userData) {
            // If user doesn't exist in users table, create profile
            const { error: insertError } = await supabase
                .from('users')
                .insert([{
                    id: user.id,
                    username: user.email.split('@')[0],
                    email: user.email
                }])
            
            if (insertError) throw insertError
        }

        // Submit score
        const { data, error } = await supabase
            .from('scores')
            .insert([{
                user_id: user.id,
                game,
                score,
                date: new Date().toISOString().split('T')[0]
            }])
        
        if (error) throw error

        alert('Score submitted successfully!');
        scoreInput.value = ''
        if (leaderboardContent) updateLeaderboard()
    } catch (error) {
        console.error('Score submission error:', error)
        alert('Error submitting score: ' + error.message)
    }
}

// Leaderboard update
async function updateLeaderboard() {
    if (!leaderboardContent || !gameSelect || !timePeriod) return
    
    const game = gameSelect.value
    const period = timePeriod.value
    
    let query = supabase
        .from('scores')
        .select(`
            *,
            users (username)
        `)
        .order('score', { ascending: true })
    
    if (game !== 'all') {
        query = query.eq('game', game)
    }
    
    // Add date filtering based on period
    const today = new Date().toISOString().split('T')[0]
    switch(period) {
        case 'today':
            query = query.eq('date', today)
            break
        case 'week':
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            query = query.gte('date', weekAgo.toISOString().split('T')[0])
            break
        case 'month':
            const monthAgo = new Date()
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            query = query.gte('date', monthAgo.toISOString().split('T')[0])
            break
    }
    
    try {
        const { data, error } = await query
        if (error) throw error
        displayLeaderboard(data)
    } catch (error) {
        console.error('Error fetching leaderboard:', error)
    }
}

function displayLeaderboard(data) {
    if (!leaderboardContent) return
    
    const table = document.createElement('table')
    const isAllGames = gameSelect.value === 'all'
    
    table.innerHTML = `
        <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Game</th>
            <th>${isAllGames ? 'Score (%)' : 'Score'}</th>
            <th>Date</th>
        </tr>
    `
    
    data.forEach((entry, index) => {
        let displayScore = entry.score;
        
        if (isAllGames) {
            // Convert scores to percentages for "All Games" view
            switch(entry.game) {
                case 'angle':
                    // Score is already stored as percentage
                    displayScore = Math.round(entry.score * 10) / 10;
                    break;
                case 'minecraftle':
                    const minecraftleScoreMap = {
                        1: 2,  // 1/6 -> 2/10
                        2: 4,  // 2/6 -> 4/10
                        3: 6,  // 3/6 -> 6/10
                        4: 8,  // 4/6 -> 8/10
                        5: 9,  // 5/6 -> 9/10
                        6: 10, // 6/6 -> 10/10
                        11: 0   // X -> 0/10
                    };
                    const mcScore = minecraftleScoreMap[entry.score];
                    displayScore = (mcScore * 10);
                    break;
                case 'travle':
                    // Convert stored score (1-11) to percentage
                    const travlePercentages = {
                        1: 100, // +0
                        2: 83,  // +1
                        3: 67,  // +2
                        4: 50,  // +3
                        5: 33,  // +4
                        6: 17,  // +5
                        7: 8,   // +6
                        11: 0   // +7 or more (failed)
                    };
                    displayScore = travlePercentages[entry.score];
                    break;
                case 'whentaken':
                    // Score is already stored as percentage
                    displayScore = Math.round(entry.score * 10) / 10;
                    break;
                case 'geogrid':
                    // Score is already stored as a percentage
                    displayScore = Math.round(entry.score * 10) / 10;
                    break;
                case 'foodguessr':
                    // Score is already stored as percentage
                    displayScore = Math.round(entry.score * 10) / 10;
                    break;
                default:
                    // For 6-attempt games (Wordle etc)
                    if (entry.score > 6) displayScore = 0;
                    else displayScore = Math.round(((7 - entry.score) / 6) * 100);
                    break;
            }
            displayScore = `${displayScore}%`;
        } else if (entry.game === 'angle') {
            // For Angle-specific view, show score out of 4
            if (entry.score === 11) {
                displayScore = 'X/4';
            } else {
                // Convert percentage back to original score
                const originalScore = 5 - Math.round(entry.score / 25);
                displayScore = `${originalScore}/4`;
            }
        } else if (entry.game === 'minecraftle') {
            // For Minecraftle-specific view, show score out of 10
            const minecraftleScoreMap = {
                1: 2, // 1/6 -> 2/10
                2: 4, // 2/6 -> 4/10
                3: 6, // 3/6 -> 6/10
                4: 8, // 4/6 -> 8/10
                5: 9, // 5/6 -> 9/10
                6: 10, // 6/6 -> 10/10
                11: 'X' // Failed attempt
            };
            displayScore = entry.score === 11 ? 'X/10' : minecraftleScoreMap[entry.score] + '/10';
        } else if (entry.game === 'travle') {
            // For Travle-specific view, show +N format
            displayScore = entry.score === 11 ? 'X' : '+' + (entry.score - 1);
        } else if (entry.game === 'whentaken') {
            // For WhenTaken-specific view, show original X/1000 format
            displayScore = `${Math.round(entry.score * 10)}/1000`;
        } else if (entry.game === 'geogrid') {
            // For GeoGrid-specific view, show original score out of 1000
            // We stored the score as (100 - score/10), so we need to reverse that
            const originalScore = Math.round((100 - entry.score) * 10);
            displayScore = `${originalScore}/1000`;
        } else if (entry.game === 'foodguessr') {
            // For FoodGuessr-specific view, show original score out of 15000
            const originalScore = Math.round((entry.score / 100) * 15000);
            displayScore = `${originalScore.toLocaleString()}/15,000`;
        } else {
            // Game-specific views
            if (entry.score === 11) {
                displayScore = 'X';
                if (entry.game === 'wordle' || entry.game === 'worldle' || entry.game === 'flagle') {
                    displayScore += '/6';
                } else if (entry.game === 'angle') {
                    displayScore += '/4';
                } else if (entry.game === 'minecraftle') {
                    displayScore += '/10';
                }
            } else {
                // For other game-specific views, show original score
                displayScore = entry.score === 11 ? 'X/6' : entry.score + '/6';
            }
        }

        const row = table.insertRow()
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.users.username}</td>
            <td>${formatGameName(entry.game)}</td>
            <td>${displayScore}</td>
            <td>${entry.date}</td>
        `
    })
    
    leaderboardContent.innerHTML = ''
    leaderboardContent.appendChild(table)
}

function showScoreSubmission() {
    if (scoreSubmission) {
        scoreSubmission.classList.remove('hidden')
    }
}

// Add function to update UI based on auth state
function updateAuthUI(isAuthenticated) {
    if (isAuthenticated) {
        // User is logged in
        if (loginBtn) loginBtn.classList.add('hidden')
        if (signupBtn) signupBtn.classList.add('hidden')
        if (profileLink) profileLink.classList.remove('hidden')
        if (scoreSubmission) scoreSubmission.classList.remove('hidden')
    } else {
        // User is logged out
        if (loginBtn) loginBtn.classList.remove('hidden')
        if (signupBtn) signupBtn.classList.remove('hidden')
        if (profileLink) profileLink.classList.add('hidden')
        if (scoreSubmission) scoreSubmission.classList.add('hidden')
        
        // Redirect from profile page if logged out
        if (window.location.pathname.includes('profile.html')) {
            window.location.href = 'index.html'
        }
    }
}

// Add function to check initial auth state
async function checkInitialAuthState() {
    const { data: { session } } = await supabase.auth.getSession()
    updateAuthUI(!!session)
}

// Update the auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
    updateAuthUI(!!session)
    
    if (session) {
        if (scoreSubmission) showScoreSubmission()
        if (leaderboardContent) updateLeaderboard()
    }
})

// Add logout handler function
async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        
        updateAuthUI(false)
        window.location.href = 'index.html'
    } catch (error) {
        console.error('Logout error:', error)
        alert('Error logging out: ' + error.message)
    }
}

// Add this function to create/get a hidden input
function getHiddenInput(game) {
    let input = document.getElementById(`${game}-score`);
    if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.id = `${game}-score`;
        document.body.appendChild(input);
    }
    return input;
}

// Update pasteFromClipboard function
async function pasteFromClipboard(game) {
    try {
        const text = await navigator.clipboard.readText();
        const scoreInput = getHiddenInput(game);
        if (scoreInput) {
            scoreInput.value = text;
            submitScore(game);
        }
    } catch (err) {
        console.error('Failed to read clipboard:', err);
        alert('Unable to access clipboard. Please paste manually.');
    }
}

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeUI)

// Update parseFoodGuesserShare function name and references
function parseFoodGuesserShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // Try to find the score pattern (e.g., "Total score: X / 15,000")
    const scoreMatch = shareText.match(/Total score: ([\d,]+) \/ 15,000/);
    if (!scoreMatch) return null;

    // Extract the score and remove commas
    const score = parseInt(scoreMatch[1].replace(/,/g, ''));
    
    // Store the actual score as a percentage with one decimal place
    return parseFloat(((score / 15000) * 100).toFixed(1));
} 