// JavaScript for User Profile Page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize notification system
    new NotificationSystem();

    const profileForm = document.getElementById('profile-form');
    const editButtons = document.querySelectorAll('.edit-btn');
    const saveButton = profileForm.querySelector('.save-btn');
    const cancelButton = profileForm.querySelector('.cancel-edit-btn');
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarPreview = document.getElementById('avatar-preview');
    const fullNameInput = document.getElementById('full_name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    let originalValues = {};

    // Function to fetch and display user data
    const fetchUserData = async () => {
        try {
            const response = await fetch('update_profile.php?action=get_user_data');
            const data = await response.json();

            if (data.status === 'success' && data.user) {
                const user = data.user;
                // Populate form fields with fetched data
                fullNameInput.value = user.full_name || '';
                emailInput.value = user.email || '';
                avatarPreview.src = user.avatar || '../homepage/images/default_avatar.jpg';
                // Password field remains masked unless edited
                passwordInput.value = '********'; // Mask password

                // Store original values for comparison on save/cancel
                originalValues = {
                    full_name: user.full_name,
                    email: user.email,
                    // password is not stored directly
                    avatar_url: user.avatar // Store avatar URL to compare if changed
                };

            } else {
                console.error('Failed to fetch user data:', data.message);
                alert('Failed to load profile data.');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            alert('An error occurred while loading profile data.');
        }
    };

    // Initial fetch of user data when the page loads
    fetchUserData();

    // Function to enable editing for a specific field
    const enableEdit = (fieldId) => {
        const inputField = document.getElementById(fieldId);
        if (inputField) {
            // Store original value if not already stored (e.g., first edit)
            if (originalValues[fieldId] === undefined) {
                originalValues[fieldId] = inputField.value;
            }

            inputField.removeAttribute('readonly');
            inputField.focus();

            // For password field, clear it to allow new input
            if (fieldId === 'password') {
                inputField.value = '';
            }

            saveButton.style.display = 'inline-flex';
            cancelButton.style.display = 'inline-flex';
        }
    };

    // Function to disable editing for all fields and revert values
    const disableEdit = () => {
        document.querySelectorAll('.profile-form input').forEach(input => {
            input.setAttribute('readonly', true);
            if (originalValues[input.id] !== undefined) {
                input.value = originalValues[input.id];
            }
        });
        // Special handling for password field if not edited
        passwordInput.value = '********';

        // Revert avatar if cancelled and it was changed
        if (originalValues.avatar_url && avatarPreview.src !== originalValues.avatar_url) {
             avatarPreview.src = originalValues.avatar_url;
        }

        saveButton.style.display = 'none';
        cancelButton.style.display = 'none';
    };

    // Event listeners for edit buttons
    editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const fieldToEdit = e.currentTarget.dataset.field;
            enableEdit(fieldToEdit);
        });
    });

    // Event listener for cancel button
    cancelButton.addEventListener('click', () => {
        disableEdit();
    });

    // Event listener for avatar upload
    avatarUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarPreview.src = e.target.result;
                saveButton.style.display = 'inline-flex';
                cancelButton.style.display = 'inline-flex';
            };
            reader.readAsDataURL(file);
        }
    });

    // Event listener for form submission (Save Changes)
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        let hasChanges = false;

        // Check for changes in text fields
        if (fullNameInput.value !== originalValues.full_name) {
            formData.append('full_name', fullNameInput.value);
            hasChanges = true;
        }
        if (emailInput.value !== originalValues.email) {
            formData.append('email', emailInput.value);
            hasChanges = true;
        }
        // Only append password if it was actually changed (not just '********')
        if (passwordInput.value !== '********' && passwordInput.value !== '') {
            formData.append('password', passwordInput.value);
            hasChanges = true;
        }

        // Check for avatar change
        if (avatarUpload.files.length > 0) {
            formData.append('avatar-upload', avatarUpload.files[0]);
            hasChanges = true;
        }

        if (!hasChanges) {
            alert('No changes to save.');
            disableEdit();
            return;
        }

        try {
            const response = await fetch('update_profile.php', {
                method: 'POST',
                body: formData // FormData handles multipart/form-data
            });
            const data = await response.json();

            if (data.status === 'success') {
                alert(data.message);
                // Update original values with newly saved data
                originalValues.full_name = fullNameInput.value;
                originalValues.email = emailInput.value;
                if (data.user && data.user.avatar) {
                    avatarPreview.src = data.user.avatar;
                    originalValues.avatar_url = data.user.avatar;
                }
                disableEdit();
                // Re-fetch user data to ensure latest state, or update UI directly
                fetchUserData();
            } else {
                alert('Error: ' + data.message);
                console.error('Profile update failed:', data.message);
            }
        } catch (error) {
            console.error('Error submitting profile data:', error);
            alert('An error occurred during profile update.');
        }
    });
}); 