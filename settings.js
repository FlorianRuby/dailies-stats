document.addEventListener('DOMContentLoaded', async () => {
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const saveUsernameBtn = document.getElementById('save-username');
    const changePictureBtn = document.getElementById('change-picture-btn');
    const pictureUpload = document.getElementById('picture-upload');
    const changePasswordBtn = document.getElementById('change-password');
    const deleteAccountBtn = document.getElementById('delete-account');

    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    // Load user data
    try {
        const { data, error } = await supabase
            .from('users')
            .select('username, email')
            .eq('id', session.user.id)
            .single();
        
        if (error) throw error;
        
        usernameInput.value = data.username;
        emailInput.value = data.email;
    } catch (error) {
        console.error('Error loading user data:', error);
        alert('Error loading user data');
    }

    // Save username
    saveUsernameBtn.addEventListener('click', async () => {
        const newUsername = usernameInput.value.trim();
        if (!newUsername) return;

        try {
            const { error } = await supabase
                .from('users')
                .update({ username: newUsername })
                .eq('id', session.user.id);

            if (error) throw error;
            alert('Username updated successfully!');
        } catch (error) {
            console.error('Error updating username:', error);
            alert('Error updating username');
        }
    });

    // Handle profile picture upload
    changePictureBtn.addEventListener('click', () => {
        pictureUpload.click();
    });

    pictureUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl }, error: urlError } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            if (urlError) throw urlError;

            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', session.user.id);

            if (updateError) throw updateError;

            alert('Profile picture updated successfully!');
        } catch (error) {
            console.error('Error updating profile picture:', error);
            alert('Error updating profile picture');
        }
    });

    // Change password (placeholder)
    changePasswordBtn.addEventListener('click', () => {
        alert('Password change functionality coming soon!');
    });

    // Delete account (placeholder with confirmation)
    deleteAccountBtn.addEventListener('click', () => {
        const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
        if (confirmed) {
            alert('Account deletion functionality coming soon!');
        }
    });
}); 