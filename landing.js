document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');

    // Switch between forms
    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // Handle login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const loginButton = loginForm.querySelector('.auth-button');
        
        // Show loading state
        loginButton.textContent = 'Logging in...';
        loginButton.disabled = true;

        try {
            // First try to find user by username
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('email')
                .eq('username', email)
                .single();
            
            // Determine email to use for login
            const loginEmail = userData?.email || email;
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password,
            });

            // If there's an error and it's not just "Email not confirmed", throw it
            if (error) {
                // Only throw if it's a real error
                if (error.message !== 'Email not confirmed') {
                    throw error;
                }
            }
            
            // Store the session and redirect - this happens even with "Email not confirmed"
            if (data?.session) {
                localStorage.setItem('supabase.auth.token', data.session.access_token);
            }
            
            window.location.href = 'home.html';
        } catch (error) {
            console.error('Login error:', error);
            // Reset button state
            loginButton.textContent = 'Login';
            loginButton.disabled = false;
            
            // Only show alerts for actual errors
            if (error && error.message === 'Invalid login credentials') {
                alert('Invalid username/email or password');
            } else if (error && !error.message.includes('Email not confirmed')) {
                alert('An error occurred during login. Please try again.');
            }
        }
    });

    // Handle signup
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const username = document.getElementById('signup-username').value;
        const signupButton = signupForm.querySelector('.auth-button');
        
        // Show loading state
        signupButton.textContent = 'Creating account...';
        signupButton.disabled = true;

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password
            });

            if (authError) throw authError;

            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('users')
                    .insert([{
                        id: authData.user.id,
                        username: username,
                        email: email
                    }]);

                if (profileError) throw profileError;

                alert('Signup successful! Please check your email for verification.');
                window.location.href = 'home.html';
            }
        } catch (error) {
            console.error('Signup error:', error);
            // Reset button state
            signupButton.textContent = 'Sign Up';
            signupButton.disabled = false;
            
            alert(error.message);
        }
    });
}); 