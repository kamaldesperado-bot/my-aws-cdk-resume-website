// Configuration for multi-cloud travel bot
const CONFIG = {
    // AWS API Gateway endpoint
    API_ENDPOINT: 'https://m26fmzzfed.execute-api.eu-central-1.amazonaws.com/prod',
    
    // External API keys (replace with your actual keys)
    OPENWEATHER_API_KEY: 'YOUR_OPENWEATHER_API_KEY',
    
    // Travel data endpoints
    ENDPOINTS: {
        chat: '/chat',
        weather: 'https://api.openweathermap.org/data/2.5/weather',
        photos: 'https://api.unsplash.com/search/photos'
    },
    
    // Unsplash API for destination photos (free tier: 50 requests/hour)
    UNSPLASH_ACCESS_KEY: 'YOUR_UNSPLASH_ACCESS_KEY',
    
    // Travel planning templates
    TRAVEL_TEMPLATES: {
        budget: {
            low: { daily: 45, accommodation: 28, food: 12, activities: 5 },
            medium: { daily: 90, accommodation: 55, food: 22, activities: 13 },
            high: { daily: 180, accommodation: 110, food: 45, activities: 25 }
        },
        destinations: {
            'paris': { country: 'France', currency: 'EUR', timezone: 'Europe/Paris' },
            'tokyo': { country: 'Japan', currency: 'JPY', timezone: 'Asia/Tokyo' },
            'london': { country: 'UK', currency: 'GBP', timezone: 'Europe/London' },
            'new york': { country: 'USA', currency: 'USD', timezone: 'America/New_York' },
            'rome': { country: 'Italy', currency: 'EUR', timezone: 'Europe/Rome' }
        }
    }
};