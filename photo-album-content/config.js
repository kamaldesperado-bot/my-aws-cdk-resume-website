// Configuration file - DO NOT commit sensitive values
// For local development, copy this to config.local.js and add real values

// Initialize CONFIG on window object
window.CONFIG = window.CONFIG || {
    // GitHub Gist Integration
    GITHUB_TOKEN: 'YOUR_GITHUB_TOKEN_HERE',
    GIST_ID: 'YOUR_GIST_ID_HERE',
    
    // Authentication
    USERNAME: 'YOUR_USERNAME_HERE',
    PASSWORD: 'YOUR_PASSWORD_HERE',
    
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: 'YOUR_CLOUD_NAME_HERE',
    CLOUDINARY_UPLOAD_PRESET: 'YOUR_UPLOAD_PRESET_HERE'
};

console.log('✅ Config.js loaded');
