// static/js/profile.js
import { authAPI } from './api.js';
import { showMessage, currentUserName, setCurrentUser, DOMElements, showLogoutConfirmation } from './utils.js';

const userProfileTrigger = DOMElements.userProfileTrigger;
const profileDropdown = DOMElements.profileDropdown;
const profileMenuBtn = DOMElements.profileMenuBtn;
const logoutDropdownBtn = DOMElements.logoutDropdownBtn;

const updateNameForm = DOMElements.updateNameForm || document.getElementById('update-name-form');
const changePasswordForm = DOMElements.changePasswordForm || document.getElementById('change-password-form');
const currentNameInput = DOMElements.currentNameInput || document.getElementById('current-name');
const newNameInput = DOMElements.newNameInput || document.getElementById('new-name');
const profileAvatar = DOMElements.profileAvatar || document.getElementById('profile-avatar');

export const setupProfileListeners = (switchPageCallback, handleLogoutCallback) => {
    userProfileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (profileDropdown.classList.contains('hidden')) {
            showProfileDropdown();
        } else {
            hideProfileDropdown();
        }
    });

    document.addEventListener('click', (e) => {
        if (!userProfileTrigger.contains(e.target) && !profileDropdown.contains(e.target)) {
            hideProfileDropdown();
        }
    });

    profileMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchPageCallback('profile');
        showProfilePage();
    });

    logoutDropdownBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showLogoutConfirmation(handleLogoutCallback);
    });

    updateNameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = newNameInput.value.trim();
        
        if (!newName) {
            showMessage('Nama tidak boleh kosong.', 'warning');
            return;
        }
        
        if (newName === currentUserName) {
            showMessage('Nama baru sama dengan nama saat ini.', 'warning');
            return;
        }
        
        const success = await updateUserProfile(newName);
        if (success) {
            newNameInput.value = '';
        }
    });

    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            showMessage('Semua field password harus diisi.', 'warning');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showMessage('Konfirmasi password tidak cocok.', 'warning');
            return;
        }
        
        if (newPassword.length < 6) {
            showMessage('Password baru minimal 6 karakter.', 'warning');
            return;
        }
        
        const success = await changeUserPassword(currentPassword, newPassword);
        if (success) {
            changePasswordForm.reset();
        }
    });
};

export const showProfilePage = () => {
    currentNameInput.value = currentUserName || '';
    if (currentUserName) {
        const initial = currentUserName.charAt(0).toUpperCase();
        profileAvatar.src = `https://placehold.co/80x80/6366f1/ffffff?text=${initial}`;
    }
    hideProfileDropdown();
};

const showProfileDropdown = () => {
    profileDropdown.classList.remove('hidden');
};

const hideProfileDropdown = () => {
    profileDropdown.classList.add('hidden');
};

const updateUserProfile = async (name) => {
    try {
        const response = await authAPI.updateProfile(name);

        if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData.id, userData.name); // Update global state
            DOMElements.userNameDisplay.textContent = userData.name;
            const initial = userData.name.charAt(0).toUpperCase();
            DOMElements.userAvatarDisplay.src = `https://placehold.co/40x40/6366f1/ffffff?text=${initial}`;
            profileAvatar.src = `https://placehold.co/80x80/6366f1/ffffff?text=${initial}`;
            currentNameInput.value = userData.name;
            showMessage('Nama berhasil diperbarui!', 'success');
            return true;
        } else {
            const errorData = await response.json();
            showMessage(errorData.detail || 'Gagal memperbarui nama.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('Terjadi kesalahan saat memperbarui nama.', 'error');
        return false;
    }
};

const changeUserPassword = async (currentPassword, newPassword) => {
    try {
        const response = await authAPI.changePassword(currentPassword, newPassword);

        if (response.ok) {
            showMessage('Password berhasil diubah!', 'success');
            return true;
        } else {
            const errorData = await response.json();
            showMessage(errorData.detail || 'Gagal mengubah password.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showMessage('Terjadi kesalahan saat mengubah password.', 'error');
        return false;
    }
};