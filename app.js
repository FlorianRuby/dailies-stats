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
    // Change default theme to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
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

    // Start countdown timer with async handling
    updateCountdown();
    setInterval(async () => {
        await updateCountdown();
    }, 1000);

    // Update submissions count
    updateTodaySubmissions();

    // Check submitted games when page loads
    checkSubmittedGames();
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    const emailOrUsername = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        // First try to find user by username
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('email')
            .eq('username', emailOrUsername)
            .single();
        
        // Determine email to use for login
        const loginEmail = userData?.email || emailOrUsername;
        
        // Attempt login
        const { data, error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password,
        });

        if (error) throw error;
        
        loginModal.classList.add('hidden');
        updateAuthUI(true);
        if (scoreSubmission) showScoreSubmission();
        if (leaderboardContent) updateLeaderboard();
        window.location.href = 'profile.html';
    } catch (error) {
        console.error('Login error:', error);
        alert('Invalid username/email or password');
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

// Update the parseFlagleShare function to be more flexible
function parseFlagleShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // First check if it's a Flagle share by looking for the URL or #Flagle
    if (!shareText.includes('flagle.io') && !shareText.includes('#Flagle')) return null;

    // Try to find the score pattern with a more flexible regex
    // This will match "#Flagle #XXXX (date) X/6" format
    const scoreMatch = shareText.match(/#Flagle #\d+ \(.*?\) (\d|X)\/(\d+)/i);
    if (!scoreMatch) return null;

    // Extract the score number and max attempts
    const scoreText = scoreMatch[1];
    const maxAttempts = parseInt(scoreMatch[2]);
    
    // Return 11 for X (failed attempt) or the actual number
    return scoreText === 'X' ? 11 : parseInt(scoreText);
}

// Update the Angle parser function
function parseAngleShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // First check if it's an Angle share by looking for the URL or #Angle
    if (!shareText.includes('angle.wtf') && !shareText.includes('#Angle')) return null;

    // Try to find the score pattern with a more flexible regex
    const scoreMatch = shareText.match(/#Angle #\d+ (\d|X)\/(\d+)/i);
    if (!scoreMatch) return null;

    // Extract the score number
    const scoreText = scoreMatch[1];
    const maxAttempts = parseInt(scoreMatch[2]);
    
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

// Add this function with the other parser functions
function parseWaffleShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // Try to find the score pattern (e.g., "#waffle1128 3/5")
    const scoreMatch = shareText.match(/#waffle\d+ (\d|X)\/5/);
    if (!scoreMatch) return null;

    // Extract the score number
    const scoreText = scoreMatch[1];
    
    // Return 0 for X (failed attempt) or the actual number
    return scoreText === 'X' ? 0 : parseInt(scoreText);
}

// Add Globle parser function
function parseGlobleShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // Try to find the score pattern (e.g., "⬜🟥🟥🟥🟩 = 5")
    const scoreMatch = shareText.match(/[⬜🟥🟩]+ = (\d+)/);
    if (!scoreMatch) return null;

    // Extract the score number
    const score = parseInt(scoreMatch[1]);
    
    // Return 11 for scores above 10 (failed attempts) or the actual number
    return score > 10 ? 11 : score;
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
        case 'waffle':
            return '🧇 Waffle'
        case 'globle':
            return '🌍 Globle'
        default:
            return game.charAt(0).toUpperCase() + game.slice(1)
    }
}

// Helper function to get CEST date string
function getCESTDate() {
    const now = new Date();
    // Convert to CEST (UTC+2)
    const cest = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    return cest.toISOString().slice(0, 10);
}

function showToast(message, isError = false) {
    // Remove any existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast${isError ? ' error' : ''}`;
    
    // Add icon based on type
    const icon = isError ? '❌' : '✅';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Update the getCESTDate function to use user's timezone
async function getUserDate() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            // Default to CEST for non-logged in users
            const now = new Date();
            const cest = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
            return cest.toISOString().split('T')[0];
        }

        // Get user's timezone
        const { data } = await supabase
            .from('users')
            .select('timezone')
            .eq('id', user.id)
            .single();

        const timezone = data?.timezone || 'Europe/Berlin';
        const now = new Date();
        const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        return userTime.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error getting user date:', error);
        // Fallback to CEST
        const now = new Date();
        const cest = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
        return cest.toISOString().split('T')[0];
    }
}

async function submitScore(game) {
    const scoreInput = document.getElementById(`${game}-score`)
    if (!scoreInput) return
    
    let score;
    
    if (game === 'waffle') {
        const shareText = scoreInput.value.trim();
        score = parseWaffleShare(shareText);
        
        if (score === null) {
            alert(`Please enter a valid ${formatGameName(game)} share text`);
            return;
        }
        
        if (score === 0) {
            alert('Score recorded as a failed attempt');
        }
    } else if (game === 'wordle') {
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
    } else if (game === 'globle') {
        const shareText = scoreInput.value.trim();
        score = parseGlobleShare(shareText);
        
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Please log in to submit scores');
            return;
        }

        const today = await getUserDate();

        // Check for existing submission
        const { data: existingSubmission, error: checkError } = await supabase
            .from('scores')
            .select()
            .eq('user_id', user.id)
            .eq('game', game)
            .eq('date', today)
            .single();

        if (checkError && checkError.code !== 'PGRST116') throw checkError;
        
        if (existingSubmission) {
            alert('You have already submitted a score for this game today. Try again after midnight local time.');
            return;
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
                date: today
            }])
        
        if (error) throw error

        // Update UI immediately
        const pasteBtn = document.querySelector(`[onclick="pasteFromClipboard('${game}')"]`);
        if (pasteBtn) {
            pasteBtn.disabled = true;
            pasteBtn.classList.add('submitted');
            pasteBtn.textContent = '✓ Submitted';
        }

        // Update counts and UI
        const submissionsElement = document.getElementById('today-submissions');
        if (submissionsElement) {
            const currentCount = parseInt(submissionsElement.textContent.split('/')[0]);
            submissionsElement.textContent = `${currentCount + 1}/14`;
        }

        scoreInput.value = '';
        if (leaderboardContent) updateLeaderboard();
        
        // Show success toast instead of alert
        showToast('Score submitted successfully!');

    } catch (error) {
        console.error('Score submission error:', error);
        // Show error toast instead of alert
        showToast(error.message, true);
    }
}

// Leaderboard update
async function updateLeaderboard() {
    if (!leaderboardContent || !gameSelect) return;

    try {
        const selectedGame = gameSelect.value;
        const { data: scores, error } = await supabase
            .from('scores')
            .select(`
                user_id,
                game,
                score,
                users (
                    username,
                    avatar_url
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching scores:', error);
            return;
        }

        if (selectedGame === 'global') {
            // Calculate global averages
            const userPerformances = {};

            scores.forEach(score => {
                if (!userPerformances[score.user_id]) {
                    userPerformances[score.user_id] = {
                        totalPerformance: 0,
                        gamesCount: 0,
                        username: score.users.username,
                        avatar_url: score.users.avatar_url
                    };
                }

                const performancePercent = calculateGamePerformance(score.game, score.score);
                userPerformances[score.user_id].totalPerformance += performancePercent;
                userPerformances[score.user_id].gamesCount++;
            });

            const leaderboardData = Object.entries(userPerformances)
                .map(([userId, data]) => ({
                    userId,
                    username: data.username,
                    avatar_url: data.avatar_url,
                    score: Math.round(data.totalPerformance / data.gamesCount),
                    gamesPlayed: data.gamesCount
                }))
                .filter(user => user.gamesPlayed > 0)
                .sort((a, b) => b.score - a.score);

            displayGlobalLeaderboard(leaderboardData);
        } else {
            // Game-specific leaderboard
            const gameScores = scores
                .filter(score => score.game === selectedGame)
                .map(score => ({
                    userId: score.user_id,
                    username: score.users.username,
                    avatar_url: score.users.avatar_url,
                    score: score.score
                }))
                .sort((a, b) => {
                    const scoreA = calculateGamePerformance(selectedGame, a.score);
                    const scoreB = calculateGamePerformance(selectedGame, b.score);
                    return scoreB - scoreA;
                });

            displayGameLeaderboard(gameScores, selectedGame);
        }
    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
}

// Helper function to format percentage numbers
function formatPercent(number) {
    // Convert to fixed 2 decimals first
    const fixed = Number(number).toFixed(2);
    // Remove trailing zeros and decimal point if not needed
    return fixed.replace(/\.?0+$/, '');
}

function formatGameScore(game, score) {
    const percent = calculateGamePerformance(game, score);
    const formattedPercent = formatPercent(percent);
    
    if (game === 'angle' || game === 'whentaken' || game === 'geogrid' || game === 'foodguessr') {
        return `${formatPercent(score)}%`;
    } else if (game === 'waffle') {
        return `${score}/5 (${formattedPercent}%)`;
    } else if (game === 'minecraftle' || game === 'travle') {
        return score === 11 ? 'X' : `+${score - 1} (${formattedPercent}%)`;
    } else {
        return score === 11 ? 'X/6' : `${score}/6 (${formattedPercent}%)`;
    }
}

function displayGlobalLeaderboard(data) {
    leaderboardContent.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Average Performance</th>
                    <th>Games Played</th>
                </tr>
            </thead>
            <tbody>
                ${data.map((user, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td class="player-cell">
                            <img src="${user.avatar_url || './assets/default_user_avatar.jpg'}" 
                                 alt="${user.username}" 
                                 class="leaderboard-avatar">
                            ${user.username}
                        </td>
                        <td>${formatPercent(user.score)}%</td>
                        <td>${user.gamesPlayed}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function displayGameLeaderboard(data, game) {
    leaderboardContent.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                ${data.map((user, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td class="player-cell">
                            <img src="${user.avatar_url || './assets/default_user_avatar.jpg'}" 
                                 alt="${user.username}" 
                                 class="leaderboard-avatar">
                            ${user.username}
                        </td>
                        <td>${formatGameScore(game, user.score)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Helper function to calculate performance percentage for a game
function calculateGamePerformance(game, score) {
    if (game === 'angle' || game === 'whentaken' || game === 'geogrid' || game === 'foodguessr') {
        return score; // These games already store percentage scores
    } else if (game === 'waffle') {
        return (score / 5) * 100;
    } else if (game === 'minecraftle') {
        const scoreMap = { 1: 100, 2: 83, 3: 67, 4: 50, 5: 33, 6: 17, 11: 0 };
        return scoreMap[score] || 0;
    } else if (game === 'travle') {
        const scoreMap = { 1: 100, 2: 83, 3: 67, 4: 50, 5: 33, 6: 17, 7: 8, 11: 0 };
        return scoreMap[score] || 0;
    } else {
        // Standard 6-attempt games (Wordle, Worldle, Flagle)
        return ((7 - score) / 6) * 100;
    }
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

// Initialize auth state
async function initializeAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Error getting session:', error);
            return false;
        }
        return !!session;
    } catch (error) {
        console.error('Error initializing auth:', error);
        return false;
    }
}

// Add function to check initial auth state
async function checkInitialAuthState() {
    const isAuthenticated = await initializeAuth();
    updateAuthUI(isAuthenticated);
}

// Update the auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        localStorage.setItem('supabase.auth.token', session.access_token);
    } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('supabase.auth.token');
    }
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
        
        // Clear auth data
        localStorage.removeItem('supabase.auth.token');
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
    // Clear previous status
    const statusElement = document.getElementById(`${game}-status`);
    if (statusElement) {
        statusElement.textContent = '';
        statusElement.className = 'paste-status';
    }
    
    navigator.clipboard.readText()
        .then(text => {
            let score = null;
            let isValid = false;
            
            try {
                // Game-specific parsing logic
                if (game === 'wordle') {
                    // Improved Wordle regex that handles numbers with or without decimal points
                    const wordleRegex = /Wordle\s+(\d+\.?\d*)\s+(\d+)\/(\d+)/i;
                    const match = text.match(wordleRegex);
                    
                    if (match) {
                        // Extract game number (removing any decimal point)
                        const gameNumber = match[1].replace('.', '');
                        const attempts = parseInt(match[2]);
                        const maxAttempts = parseInt(match[3]);
                        
                        if (attempts > 0 && attempts <= maxAttempts) {
                            score = attempts;
                            isValid = true;
                        }
                    }
                } else if (game === 'foodguessr') {
                    score = parseFoodGuesserShare(text);
                    if (score !== null) {
                        isValid = true;
                    }
                } else if (game === 'flagle') {
                    score = parseFlagleShare(text);
                    if (score !== null) {
                        isValid = true;
                    }
                } else if (game === 'angle') {
                    score = parseAngleShare(text);
                    if (score !== null) {
                        isValid = true;
                    }
                } else if (game === 'worldle') {
                    score = parseWorldleShare(text);
                    if (score !== null) {
                        isValid = true;
                    }
                } else if (game === 'wheretaken') {
                    score = parseWhereTakenShare(text);
                    if (score !== null) {
                        isValid = true;
                    }
                } else if (game === 'wheretaken-us') {
                    score = parseWhereTakenUSShare(text);
                    if (score !== null) {
                        isValid = true;
                    }
                } else if (game === 'minecraftle') {
                    score = parseMinecraftleShare(text);
                    if (score !== null) {
                        isValid = true;
                    }
                } else if (game === 'travle') {
                    score = parseTravleShare(text);
                    if (score !== null) {
                        isValid = true;
                    }
                } else if (game === 'whentaken') {
                    score = parseWhenTakenShare(text);
                    if (score !== null) {
                        isValid = true;
                    }
                } else if (game === 'geogrid') {
                    score = parseGeoGridShare(text);
                    if (score !== null) {
                        isValid = true;
                    }
                } else if (game === 'waffle') {
                    score = parseWaffleShare(text);
                    if (score !== null) {
                        isValid = true;
                    }
                } else if (game === 'globle') {
                    score = parseGlobleShare(text);
                    if (score !== null) {
                        isValid = true;
                    }
                }
                
                if (isValid && score !== null) {
                    // Create hidden input for the score
                    const scoreInput = getHiddenInput(game);
                    scoreInput.value = text;
                    
                    // Submit the score
                    submitScore(game);
                    
                    // Show success message
                    if (statusElement) {
                        statusElement.textContent = `Score submitted: ${score}`;
                        statusElement.className = 'paste-status paste-success';
                    }
                } else {
                    throw new Error("Invalid score format");
                }
            } catch (error) {
                console.error(`Error parsing ${game} score:`, error);
                
                // Show error message
                if (statusElement) {
                    statusElement.textContent = `Could not parse score. Please try again.`;
                    statusElement.className = 'paste-status paste-error';
                }
            }
        })
        .catch(err => {
            console.error('Failed to read clipboard contents: ', err);
            
            // Show error message
            if (statusElement) {
                statusElement.textContent = `Clipboard access failed. Please try again.`;
                statusElement.className = 'paste-status paste-error';
            }
        });
}

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
});

// Update parseFoodGuesserShare function name and references
function parseFoodGuesserShare(shareText) {
    // Check if share text is provided
    if (!shareText) return null;

    // First check if it's a FoodGuessr share by looking for the URL
    if (!shareText.includes('foodguessr.com')) return null;

    // Try to find the score pattern with a more flexible regex
    // This will match "Total score: X,XXX / 15,000" anywhere in the text
    const scoreMatch = shareText.match(/Total score: ([\d,]+)\s*\/\s*15,000/i);
    if (!scoreMatch) return null;

    // Extract the score and remove commas
    const score = parseInt(scoreMatch[1].replace(/,/g, ''));
    
    // Store the actual score as a percentage with one decimal place
    return parseFloat(((score / 15000) * 100).toFixed(1));
}

// Update formatScore function if it exists
function formatScore(game, score) {
    if (score === null) return '';
    
    switch(game) {
        case 'waffle':
            return score === 0 ? 'X/5' : `${score}/5`;
        // ... existing cases ...
    }
}

// Add these functions near the top with other utility functions
async function getTimeUntilMidnight() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            // Default to Berlin time for non-logged in users
            const now = new Date();
            const berlin = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
            const midnight = new Date(berlin);
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight - berlin;
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            return `${hours}h ${minutes}m`;
        }

        // Get user's timezone
        const { data, error } = await supabase
            .from('users')
            .select('timezone')
            .eq('id', user.id)
            .single();

        const timezone = data?.timezone || 'Europe/Berlin';
        
        const now = new Date();
        const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const midnight = new Date(userTime);
        midnight.setHours(24, 0, 0, 0);
        const diff = midnight - userTime;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    } catch (error) {
        console.error('Error calculating time:', error);
        return 'Error';
    }
}

// Update countdown function to handle async
async function updateCountdown() {
    const countdownElement = document.getElementById('countdown-time');
    if (!countdownElement) return;
    
    try {
        const timeLeft = await getTimeUntilMidnight();
        countdownElement.textContent = timeLeft;
    } catch (error) {
        console.error('Error updating countdown:', error);
        countdownElement.textContent = 'Error';
    }
}

// Update the interval to use async function
setInterval(async () => {
    await updateCountdown();
}, 1000);

// Update the updateTodaySubmissions function
async function updateTodaySubmissions() {
    const submissionsElement = document.getElementById('today-submissions');
    if (!submissionsElement) return;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = await getUserDate();
        const { data, error } = await supabase
            .from('scores')
            .select('game')
            .eq('user_id', user.id)
            .eq('date', today);

        if (error) throw error;

        submissionsElement.textContent = `${data.length}/14`;
    } catch (error) {
        console.error('Error fetching submissions:', error);
    }
}

// Add this helper function to check if it's a new day
function isNewDay(lastSubmitDate) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastSubmit = new Date(lastSubmitDate);
    return lastSubmit < today;
}

// Update checkSubmittedGames to use getUserDate() for timezone-aware date checking
async function checkSubmittedGames() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get today's date in user's timezone
        const today = await getUserDate();
        
        // Get today's submissions
        const { data, error } = await supabase
            .from('scores')
            .select('game, date')  // Add date to selection
            .eq('user_id', user.id)
            .eq('date', today);    // Filter by today's date in user's timezone

        if (error) throw error;

        // Update submission count
        const submissionsElement = document.getElementById('today-submissions');
        if (submissionsElement) {
            submissionsElement.textContent = `${data.length}/14`;
        }

        // Update UI for each game
        document.querySelectorAll('.game-card').forEach(card => {
            const pasteBtn = card.querySelector('.paste-btn');  // Update selector to be more specific
            if (!pasteBtn || card.classList.contains('info-card')) return;

            const game = pasteBtn.getAttribute('onclick')?.match(/pasteFromClipboard\('(.+?)'\)/)?.[1];
            if (!game) return;
            
            // Check if this game has been submitted today
            const isSubmittedToday = data.some(entry => entry.game === game && entry.date === today);
            
            if (isSubmittedToday) {
                pasteBtn.disabled = true;
                pasteBtn.classList.add('submitted');
                pasteBtn.textContent = '✓ Submitted';
            } else {
                pasteBtn.disabled = false;
                pasteBtn.classList.remove('submitted');
                pasteBtn.textContent = '📋 Paste Score';
            }
        });

    } catch (error) {
        console.error('Error checking submitted games:', error);
    }
}

// Update the interval to check more frequently around midnight
function setupSubmissionCheck() {
    // Initial check
    checkSubmittedGames();

    // Check every minute
    setInterval(checkSubmittedGames, 60000);
}

// Call this function when initializing the app
setupSubmissionCheck();

// Add this function to calculate global rank for a user
async function calculateGlobalRank(userId) {
    try {
        // Get all scores
        const { data: scores, error } = await supabase
            .from('scores')
            .select(`
                user_id,
                game,
                score,
                users (
                    username
                )
            `);

        if (error) throw error;

        // Calculate average performance for each user
        const userPerformances = {};
        scores.forEach(score => {
            if (!userPerformances[score.user_id]) {
                userPerformances[score.user_id] = {
                    totalPerformance: 0,
                    gamesCount: 0
                };
            }
            const performancePercent = calculateGamePerformance(score.game, score.score);
            userPerformances[score.user_id].totalPerformance += performancePercent;
            userPerformances[score.user_id].gamesCount++;
        });

        // Convert to array and sort by average performance
        const rankedUsers = Object.entries(userPerformances)
            .map(([id, data]) => ({
                userId: id,
                averageScore: data.gamesCount > 0 ? data.totalPerformance / data.gamesCount : 0
            }))
            .filter(user => user.averageScore > 0)
            .sort((a, b) => b.averageScore - a.averageScore);

        // Find user's position
        const userRank = rankedUsers.findIndex(user => user.userId === userId) + 1;
        const totalPlayers = rankedUsers.length;

        return { rank: userRank, total: totalPlayers };
    } catch (error) {
        console.error('Error calculating global rank:', error);
        return null;
    }
}

// Update the displayUserStats function to include global rank
async function displayUserStats(scores, userId) {
    try {
        const stats = processStats(scores);
        const globalRank = await calculateGlobalRank(userId);
        
        const statsContainer = document.getElementById('stats-container');
        if (!statsContainer) return;

        // Calculate games per day
        const uniqueDates = new Set(scores.map(score => score.date)).size;
        const totalDays = scores.length > 0 
            ? Math.max(1, Math.round((new Date() - new Date(scores[0].date)) / (1000 * 60 * 60 * 24)))
            : 1;
        const gamesPerDay = (scores.length / totalDays).toFixed(1);

        // Add global rank and games per day stats
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${gamesPerDay}</div>
                <div class="stat-label">Games/Day</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${globalRank ? `#${globalRank.rank}/${globalRank.total}` : 'N/A'}</div>
                <div class="stat-label">Global Rank</div>
            </div>
            ${Object.entries(stats).map(([game, stat]) => `
                <div class="stat-card">
                    <div class="stat-header">${formatGameName(game)}</div>
                    <div class="stat-content">
                        <div>
                            <div class="stat-value">${formatScoreForDisplay(game, stat.best)}</div>
                            <div class="stat-label">Best Score</div>
                        </div>
                        <div>
                            <div class="stat-value">${stat.count}</div>
                            <div class="stat-label">Games Played</div>
                        </div>
                        <div>
                            <div class="stat-value">${formatScoreForDisplay(game, stat.total / stat.count)}</div>
                            <div class="stat-label">Average</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
    } catch (error) {
        console.error('Error displaying stats:', error);
    }
} 