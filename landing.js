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

            if (error && error.message !== 'Email not confirmed') throw error;
            
            // Store the session
            if (data?.session) {
                localStorage.setItem('supabase.auth.token', data.session.access_token);
            }
            
            window.location.href = 'home.html';
        } catch (error) {
            console.error('Login error:', error);
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
            alert(error.message);
        }
    });
}); 