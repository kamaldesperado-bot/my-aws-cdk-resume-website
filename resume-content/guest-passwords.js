// Guest Password Authentication System
// TODO: Implement secure backend authentication
// Client-side password validation is NOT SECURE
// This needs to be replaced with proper server-side authentication

// SECURITY NOTICE:
// All guest passwords have been removed for security reasons.
// To implement proper guest access:
// 1. Set up backend API for password generation and validation
// 2. Store hashed passwords in a secure database
// 3. Implement rate limiting and expiration
// 4. Use HTTPS for all authentication requests
// 5. Consider using AWS Cognito for user management

const GUEST_PASSWORDS = [
    // Passwords removed - configure backend authentication
];

// Check if password has been used
function isPasswordUsed(password) {
    const usedPasswords = JSON.parse(localStorage.getItem('usedGuestPasswords') || '[]');
    return usedPasswords.includes(password);
}

// Mark password as used
function markPasswordAsUsed(password) {
    const usedPasswords = JSON.parse(localStorage.getItem('usedGuestPasswords') || '[]');
    if (!usedPasswords.includes(password)) {
        usedPasswords.push(password);
        localStorage.setItem('usedGuestPasswords', JSON.stringify(usedPasswords));
    }
}

// Validate guest password
function validateGuestPassword(password) {
    if (isPasswordUsed(password)) {
        return { valid: false, reason: 'already_used' };
    }

    if (GUEST_PASSWORDS.includes(password)) {
        markPasswordAsUsed(password);
        return { valid: true, reason: 'success' };
    }

    return { valid: false, reason: 'invalid' };
}

// Get count of remaining passwords
function getRemainingPasswordCount() {
    const usedPasswords = JSON.parse(localStorage.getItem('usedGuestPasswords') || '[]');
    return GUEST_PASSWORDS.length - usedPasswords.filter(pwd => GUEST_PASSWORDS.includes(pwd)).length;
}
