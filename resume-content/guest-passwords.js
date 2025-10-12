// One-Time Guest Passwords (NOT SECURE - client-side only!)
// Each password can only be used ONCE
// After use, it's marked as used in localStorage

const GUEST_PASSWORDS = [
    "K9#mL2pQ7x",
    "R5$nW8tY3z",
    "T6@hF4vB9m",
    "P3%jD7wX2k",
    "M8&cV5nR1q",
    "Q2*sH9gT6y",
    "W7!fJ3xZ8p",
    "L4#bN6mK5v",
    "Y1$qR8cW9t",
    "Z5@dG3pL7n",
    "A9%hT2vF6m",
    "S4&kM7wX3j",
    "D8*pQ1nR5y",
    "F2!tL6bW9z",
    "G7#vN4cH8k",
    "H3$xZ9mT2q",
    "J6@wK5pR7v",
    "K1%cF8nL4y",
    "N5&mQ2tW9z",
    "B9*hD7vX3p",
    "C4!jL1nR6k",
    "V8#pT5wM2q",
    "X2$nF9cH7y",
    "E6@kR3vL8z",
    "I1%mW7tQ4p",
    "O5&cD9nF2v",
    "U9*hL3xR6k",
    "T7!pM1wN8q",
    "R4#vQ5cT2y",
    "P8$nK9tL7z",
    "L2@hF6wM3p",
    "M6%jD1vR9k",
    "N3&cQ7nT5q",
    "Q9*pW2tL8y",
    "W5!hR6xF4z",
    "Y1#vM8cN7p",
    "Z7$tK3nQ2k",
    "A4@pL9wD6v",
    "S8%hT1cR5q",
    "D2&vF7nM9y",
    "F6*cW3tK8z",
    "G1!pQ5xL4p",
    "H9#nR7wT2k",
    "J3$vM6cF8q",
    "K7@tD1nQ5y",
    "B5%pL9wH3z",
    "C2&hR4cM7p",
    "V8*vT6nF1k",
    "X4!cW9tQ5q",
    "E7#pL2nR8y",
    "I3$hM6wD9z",
    "O9@vK1cT4p",
    "U5%nF7tQ2k",
    "T1&pR8wL6q",
    "R6*cM3nH9y",
    "P2!vT7xF4z",
    "L8#hD5wQ1p",
    "M4$nK9cR7k",
    "N7@pW2tM5q",
    "Q3%vL6nF8y",
    "W9&hT1cD4z",
    "Y5*pR7wK2p",
    "Z1!cM8nQ6k",
    "A6#vF3tL9q",
    "S2$hD7wR4y",
    "D8@pK1cM5z",
    "F4%nT9vQ7p",
    "G7&cW2tF3k",
    "H1*pL6nR8q",
    "J5!vM9wD2y",
    "K3#hQ7cT6z",
    "B8$pF1nL4p",
    "C6@vR5wK9k",
    "V2%cM8tD3q",
    "X7&hL1nQ6y",
    "E3*pT9wF4z",
    "I8!vK2cR7p",
    "O4#nM6tL1k",
    "U9$hD3wQ8q",
    "T5@pF7cN2y",
    "R1%vW9nT6z",
    "P7&cK4tM3p",
    "L3*hR8wQ1k",
    "M9!pD2cF5q",
    "N6#vL7nT4y",
    "Q2$hW1tK8z",
    "W8@pM5cR3p",
    "Y4%vT9nD7k",
    "Z1&cF6wL2q",
    "A7*hQ3tR9y",
    "S5!pK8nM4z",
    "D2#vW7cF1p",
    "F8$hL4tQ6k",
    "G3@pR9wN2q",
    "H6%cD1vT7y",
    "J2&nM8tF5z",
    "K9*pL3wQ4p",
    "B5!vR7cK1k",
    "C1#hT6nM9q"
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
