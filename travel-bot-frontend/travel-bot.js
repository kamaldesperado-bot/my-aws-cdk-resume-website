class TravelBot {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.conversationHistory = [];
        this.lastContext = null; // Track conversation context
        this.initializeEventListeners();
        this.cloudServices = {
            aws: true,
            gcp: true,
            azure: true
        };
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    initializeEventListeners() {
        const userInput = document.getElementById('user-input');
        const sendButton = document.getElementById('send-button');
        const resetButton = document.getElementById('reset-button');

        sendButton.addEventListener('click', () => this.sendMessage());
        resetButton.addEventListener('click', () => this.resetChat());
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    async sendMessage() {
        const userInput = document.getElementById('user-input');
        const message = userInput.value.trim();
        
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        userInput.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Process message through multi-cloud pipeline
            const response = await this.processMessage(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'bot');
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            console.error('Error processing message:', error);
        }
    }

    async processMessage(message) {
        // Simulate multi-cloud processing
        const intent = this.extractIntent(message);
        
        switch (intent.type) {
            case 'plan_trip':
                return await this.planTrip(intent.entities);
            case 'check_weather':
                return await this.getWeather(intent.entities.destination);
            case 'find_flights':
                return await this.findFlights(intent.entities);
            case 'create_itinerary':
                return this.createItinerary(intent.entities);
            default:
                return this.getGeneralResponse(message);
        }
    }

    extractIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        // Handle yes/no responses based on context
        if (this.lastContext && (lowerMessage.includes('yes') || lowerMessage.includes('sure') || lowerMessage.includes('ok') || lowerMessage === 'y')) {
            return {
                type: this.lastContext.suggestedAction,
                entities: this.lastContext.entities || {}
            };
        }
        
        if (lowerMessage.includes('no') || lowerMessage.includes('not')) {
            this.lastContext = null;
            return { type: 'general', entities: {} };
        }
        
        // Clear context for new queries
        this.lastContext = null;
        
        // Simple intent recognition (in real implementation, this would use AWS Lex)
        if (lowerMessage.includes('plan') && (lowerMessage.includes('trip') || lowerMessage.includes('travel'))) {
            return {
                type: 'plan_trip',
                entities: this.extractTripEntities(message)
            };
        }
        
        if (lowerMessage.includes('weather') || lowerMessage.includes('temperature')) {
            return {
                type: 'check_weather',
                entities: { destination: this.extractDestination(message) }
            };
        }
        
        if (lowerMessage.includes('flight') || lowerMessage.includes('fly') || lowerMessage.includes('ticket') || lowerMessage.includes('book') || lowerMessage.includes('airline')) {
            return {
                type: 'find_flights',
                entities: this.extractFlightEntities(message)
            };
        }
        
        if (lowerMessage.includes('itinerary') || lowerMessage.includes('schedule')) {
            return {
                type: 'create_itinerary',
                entities: this.extractTripEntities(message)
            };
        }
        
        return { type: 'general', entities: {} };
    }

    extractTripEntities(message) {
        const entities = {};
        
        // Extract destination
        entities.destination = this.extractDestination(message);
        
        // Extract duration
        const durationMatch = message.match(/(\d+)\s*(day|week|month)/i);
        if (durationMatch) {
            entities.duration = parseInt(durationMatch[1]);
            entities.durationType = durationMatch[2].toLowerCase();
        }
        
        // Extract budget (support both € and $)
        const budgetMatch = message.match(/[€$](\d+)|(\d+)\s*[€$]|(\d+)\s*euro/);
        if (budgetMatch) {
            entities.budget = parseInt(budgetMatch[1] || budgetMatch[2] || budgetMatch[3]);
        }
        
        return entities;
    }

    extractDestination(message) {
        const lowerMessage = message.toLowerCase();
        
        // Extended list of destinations
        const destinations = {
            // Major cities
            'paris': 'paris', 'france': 'paris',
            'tokyo': 'tokyo', 'japan': 'tokyo',
            'london': 'london', 'england': 'london', 'uk': 'london',
            'new york': 'new york', 'nyc': 'new york', 'manhattan': 'new york',
            'rome': 'rome', 'italy': 'rome',
            'barcelona': 'barcelona', 'spain': 'barcelona',
            'amsterdam': 'amsterdam', 'netherlands': 'amsterdam',
            'berlin': 'berlin', 'germany': 'berlin',
            'madrid': 'madrid',
            'lisbon': 'lisbon', 'portugal': 'lisbon',
            'vienna': 'vienna', 'austria': 'vienna',
            'prague': 'prague', 'czech': 'prague',
            'budapest': 'budapest', 'hungary': 'budapest',
            'stockholm': 'stockholm', 'sweden': 'stockholm',
            'copenhagen': 'copenhagen', 'denmark': 'copenhagen',
            'oslo': 'oslo', 'norway': 'oslo',
            'helsinki': 'helsinki', 'finland': 'helsinki',
            'dublin': 'dublin', 'ireland': 'dublin',
            'edinburgh': 'edinburgh', 'scotland': 'edinburgh',
            'zurich': 'zurich', 'switzerland': 'zurich',
            'brussels': 'brussels', 'belgium': 'brussels',
            'athens': 'athens', 'greece': 'athens',
            'istanbul': 'istanbul', 'turkey': 'istanbul',
            'moscow': 'moscow', 'russia': 'moscow',
            'dubai': 'dubai', 'uae': 'dubai',
            'singapore': 'singapore',
            'hong kong': 'hong kong',
            'bangkok': 'bangkok', 'thailand': 'bangkok',
            'seoul': 'seoul', 'south korea': 'seoul',
            'beijing': 'beijing', 'china': 'beijing',
            'mumbai': 'mumbai', 'india': 'mumbai',
            'chennai': 'chennai', 'madras': 'chennai',
            'delhi': 'delhi', 'new delhi': 'delhi',
            'bangalore': 'bangalore', 'bengaluru': 'bangalore',
            'kolkata': 'kolkata', 'calcutta': 'kolkata',
            'hyderabad': 'hyderabad',
            'pune': 'pune',
            'ahmedabad': 'ahmedabad',
            'jaipur': 'jaipur',
            'kochi': 'kochi', 'cochin': 'kochi',
            'goa': 'goa',
            'sydney': 'sydney', 'australia': 'sydney',
            'melbourne': 'melbourne',
            'kuala lumpur': 'kuala lumpur', 'malaysia': 'kuala lumpur',
            'jakarta': 'jakarta', 'indonesia': 'jakarta',
            'manila': 'manila', 'philippines': 'manila',
            'ho chi minh': 'ho chi minh', 'vietnam': 'ho chi minh',
            'hanoi': 'hanoi',
            'toronto': 'toronto', 'canada': 'toronto',
            'vancouver': 'vancouver',
            'los angeles': 'los angeles', 'la': 'los angeles',
            'san francisco': 'san francisco', 'sf': 'san francisco',
            'chicago': 'chicago',
            'miami': 'miami', 'florida': 'miami',
            'las vegas': 'las vegas', 'vegas': 'las vegas',
            'mexico city': 'mexico city', 'mexico': 'mexico city',
            'rio': 'rio de janeiro', 'brazil': 'rio de janeiro',
            'buenos aires': 'buenos aires', 'argentina': 'buenos aires',
            'cairo': 'cairo', 'egypt': 'cairo',
            'cape town': 'cape town', 'south africa': 'cape town'
        };
        
        // Check for exact matches first
        for (const [key, value] of Object.entries(destinations)) {
            if (lowerMessage.includes(key)) {
                return value;
            }
        }
        
        // If no match found, extract any word that might be a city (case insensitive)
        const words = message.toLowerCase().split(' ');
        for (const word of words) {
            if (word.length > 3 && /^[a-z]+$/.test(word) && !['plan', 'trip', 'visit', 'travel', 'days', 'under', 'with', 'budget'].includes(word)) {
                return word;
            }
        }
        
        return null;
    }

    extractFlightEntities(message) {
        const destination = this.extractDestination(message);
        const departure = this.extractDeparture(message);
        
        console.log('Flight entities extracted:', { destination, departure, message, lowerMessage: message.toLowerCase() });
        
        return {
            destination,
            departure
        };
    }

    extractDeparture(message) {
        // Simple departure extraction
        const fromMatch = message.match(/from\s+([a-zA-Z\s]+?)(?:\s+to|\s+$)/i);
        return fromMatch ? fromMatch[1].trim() : null;
    }

    async planTrip(entities) {
        const { destination, duration = 3, budget = 1000 } = entities;
        
        if (!destination) {
            return "I'd love to help you plan a trip! Could you tell me which destination you're interested in? For example: 'Plan a 3-day trip to Paris under €900'";
        }

        // Simulate multi-cloud processing
        await this.simulateCloudProcessing();
        
        const destInfo = CONFIG.TRAVEL_TEMPLATES.destinations[destination] || {
            country: 'Unknown',
            currency: 'USD',
            timezone: 'UTC'
        };

        const budgetLevel = this.determineBudgetLevel(budget, duration);
        const dailyBudget = CONFIG.TRAVEL_TEMPLATES.budget[budgetLevel];
        
        const totalEstimate = duration * dailyBudget.daily;
        const withinBudget = totalEstimate <= budget;

        let response = `🌟 Great choice! Here's a ${duration}-day trip plan for ${destination.charAt(0).toUpperCase() + destination.slice(1)}:\n\n`;
        
        response += `💰 Budget Analysis:\n`;
        response += `• Your budget: €${budget}\n`;
        response += `• Estimated cost: €${totalEstimate} (${budgetLevel} tier)\n`;
        response += `• Daily breakdown: €${dailyBudget.daily}/day\n`;
        response += `  - Accommodation: €${dailyBudget.accommodation}\n`;
        response += `  - Food: €${dailyBudget.food}\n`;
        response += `  - Activities: €${dailyBudget.activities}\n\n`;
        
        if (withinBudget) {
            response += `✅ Perfect! Your budget covers a ${budgetLevel}-tier experience.\n\n`;
        } else {
            response += `⚠️ Your budget might be tight for ${budgetLevel}-tier. Consider a ${duration - 1}-day trip or increasing budget to €${totalEstimate}.\n\n`;
        }
        
        response += `🗺️ Suggested Itinerary:\n`;
        response += this.generateItinerary(destination, duration);
        
        // Add weather suggestion
        // Set context for follow-up questions
        this.lastContext = {
            suggestedAction: 'check_weather',
            entities: { destination },
            alternativeAction: 'find_flights'
        };
        
        response += `\n\nWould you like me to check the weather forecast for ${destination} or help you find flights? (Just say 'yes' for weather or 'flights' for flight search)`;
        
        return response;
    }

    async getWeather(destination) {
        if (!destination) {
            return "Which destination would you like to check the weather for?";
        }

        // Simulate weather API call
        await this.simulateCloudProcessing();
        
        // Mock weather data (in real implementation, this would call OpenWeatherMap API)
        const mockWeather = {
            temperature: Math.floor(Math.random() * 30) + 5,
            condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
            humidity: Math.floor(Math.random() * 40) + 40
        };

        return `🌤️ Weather in ${destination.charAt(0).toUpperCase() + destination.slice(1)}:\n\n` +
               `• Temperature: ${mockWeather.temperature}°C\n` +
               `• Condition: ${mockWeather.condition}\n` +
               `• Humidity: ${mockWeather.humidity}%\n\n` +
               `Perfect weather for exploring! Would you like me to suggest activities based on the weather?`;
    }

    async findFlights(entities) {
        const { destination, departure } = entities;
        
        console.log('Finding flights for:', entities);
        
        if (!destination) {
            return "I'd be happy to help you find flights! Which destination are you looking to fly to? Try: 'Find flights to Paris' or 'Book ticket to Tokyo'";
        }

        // Simulate flight search processing
        await this.simulateCloudProcessing();

        // Mock flight data with European prices
        const mockFlights = [
            { price: 290, airline: 'Lufthansa', duration: '2h 30m', stops: 'Direct' },
            { price: 180, airline: 'Ryanair', duration: '2h 45m', stops: 'Direct' },
            { price: 350, airline: 'Air France', duration: '2h 15m', stops: 'Direct' },
            { price: 220, airline: 'EasyJet', duration: '3h 10m', stops: '1 stop' }
        ];

        let response = `✈️ Flight Search Results ${departure ? `from ${departure.charAt(0).toUpperCase() + departure.slice(1)}` : 'from your location'} to ${destination.charAt(0).toUpperCase() + destination.slice(1)}:\n\n`;
        
        mockFlights.forEach((flight, index) => {
            response += `${index + 1}. ${flight.airline} - €${flight.price}\n`;
            response += `   ⏱️ ${flight.duration} (${flight.stops})\n`;
            response += `   🎫 Economy class\n\n`;
        });
        
        response += `💡 Tips:\n`;
        response += `• Book 2-3 weeks in advance for better prices\n`;
        response += `• Tuesday/Wednesday flights are usually cheaper\n`;
        response += `• Consider nearby airports for more options\n\n`;
        // Set context for trip planning
        this.lastContext = {
            suggestedAction: 'plan_trip',
            entities: { destination }
        };
        
        response += `Would you like me to help you plan your trip to ${destination}? (Just say 'yes' to start planning)`;
        
        return response;
    }

    createItinerary(entities) {
        const { destination, duration = 3 } = entities;
        
        if (!destination) {
            return "I'd love to create an itinerary for you! Which destination are you planning to visit?";
        }

        let response = `📋 ${duration}-Day Itinerary for ${destination.charAt(0).toUpperCase() + destination.slice(1)}:\n\n`;
        response += this.generateItinerary(destination, duration);
        
        return response;
    }

    generateItinerary(destination, duration) {
        const activities = {
            'paris': [
                'Visit the Eiffel Tower and Trocadéro',
                'Explore the Louvre Museum',
                'Stroll through Montmartre and Sacré-Cœur',
                'Seine River cruise',
                'Visit Notre-Dame and Sainte-Chapelle',
                'Shopping on Champs-Élysées',
                'Day trip to Versailles'
            ],
            'tokyo': [
                'Explore Shibuya and Harajuku',
                'Visit Senso-ji Temple in Asakusa',
                'Experience Tsukiji Fish Market',
                'Discover Meiji Shrine',
                'Shop in Ginza district',
                'Visit Tokyo Skytree',
                'Day trip to Mount Fuji'
            ],
            'london': [
                'Tour the Tower of London',
                'Visit British Museum',
                'Explore Westminster and Big Ben',
                'Stroll through Hyde Park',
                'Experience Camden Market',
                'Thames River cruise',
                'Day trip to Windsor Castle'
            ],
            'new york': [
                'Visit Times Square and Broadway',
                'Explore Central Park',
                'See Statue of Liberty',
                'Walk through Brooklyn Bridge',
                'Visit 9/11 Memorial',
                'Shop on Fifth Avenue',
                'Experience High Line park'
            ],
            'chennai': [
                'Visit Marina Beach',
                'Explore Kapaleeshwarar Temple',
                'Tour Fort St. George',
                'Experience local Tamil cuisine',
                'Visit Government Museum',
                'Stroll through Mylapore',
                'Day trip to Mahabalipuram'
            ],
            'mumbai': [
                'Visit Gateway of India',
                'Explore Bollywood studios',
                'Walk along Marine Drive',
                'Experience street food at Chowpatty',
                'Visit Elephanta Caves',
                'Shop at Colaba Causeway',
                'Tour Dharavi slum'
            ],
            'delhi': [
                'Visit Red Fort and India Gate',
                'Explore Chandni Chowk market',
                'Tour Humayun\'s Tomb',
                'Visit Lotus Temple',
                'Experience Old Delhi food walk',
                'See Qutub Minar',
                'Day trip to Agra (Taj Mahal)'
            ],
            'rome': [
                'Tour the Colosseum',
                'Visit Vatican Museums',
                'Throw coin in Trevi Fountain',
                'Explore Roman Forum',
                'Walk through Trastevere',
                'Visit Pantheon',
                'Day trip to Pompeii'
            ],
            'barcelona': [
                'Visit Sagrada Familia',
                'Stroll down Las Ramblas',
                'Explore Park Güell',
                'Relax at Barceloneta Beach',
                'Tour Gothic Quarter',
                'Visit Casa Batlló',
                'Experience local tapas'
            ],
            'amsterdam': [
                'Canal cruise tour',
                'Visit Anne Frank House',
                'Explore Rijksmuseum',
                'Bike through Vondelpark',
                'See Van Gogh Museum',
                'Walk through Red Light District',
                'Visit Keukenhof Gardens'
            ]
        };

        const destActivities = activities[destination] || [
            `Explore ${destination} city center`,
            `Visit ${destination} museums and galleries`,
            `Try authentic ${destination} cuisine`,
            `Walk through ${destination} historic districts`,
            `Discover ${destination} popular landmarks`,
            `Experience ${destination} local culture`,
            `Shop in ${destination} markets`
        ];

        let itinerary = '';
        for (let day = 1; day <= duration; day++) {
            itinerary += `Day ${day}: ${destActivities[(day - 1) % destActivities.length]}\n`;
        }
        
        return itinerary;
    }

    getGeneralResponse(message) {
        const responses = [
            "I'm here to help you plan amazing trips! Try asking me to 'plan a trip to Paris' or 'check weather in Tokyo'.",
            "I can help you with travel planning, weather forecasts, flight searches, and creating itineraries. What would you like to explore?",
            "Let's plan your next adventure! I can suggest destinations, check weather, find flights, and create detailed itineraries.",
            "I'm powered by multiple cloud services to give you the best travel advice. Ask me about any destination!"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    determineBudgetLevel(budget, duration) {
        const dailyBudget = budget / duration;
        if (dailyBudget < 70) return 'low';
        if (dailyBudget < 135) return 'medium';
        return 'high';
    }

    async simulateCloudProcessing() {
        // Simulate multi-cloud processing delay
        return new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    }

    addMessage(content, sender) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (sender === 'bot') {
            messageContent.innerHTML = `<strong>TravelBot:</strong> ${content.replace(/\n/g, '<br>')}`;
        } else {
            messageContent.textContent = content;
        }
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Store in conversation history
        this.conversationHistory.push({ sender, content, timestamp: Date.now() });
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message';
        typingDiv.id = 'typing-indicator';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'typing-indicator';
        typingContent.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        
        typingDiv.appendChild(typingContent);
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    resetChat() {
        // Clear chat messages
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        
        // Clear conversation history and context
        this.conversationHistory = [];
        this.lastContext = null;
        
        // Generate new session ID
        this.sessionId = this.generateSessionId();
        
        // Add welcome message
        this.addMessage(
            "Hi! I'm your REAL AI travel assistant powered by AWS Lex, Google Dialogflow, and Azure Cognitive Services. " +
            "I can help you plan trips, find flights, check weather, and create itineraries. " +
            "Try saying: 'Plan a 3-day trip to Paris under €900' ✈️",
            'bot'
        );
        
        console.log('Chat reset - New session:', this.sessionId);
    }
}

// Initialize the travel bot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TravelBot();
});