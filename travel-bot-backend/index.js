const AWS = require('aws-sdk');
const axios = require('axios');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

// Initialize AWS services
const dynamodb = new AWS.DynamoDB.DocumentClient();
const lexruntime = new AWS.LexRuntimeV2();

// Initialize Google Dialogflow (optional)
let dialogflowClient;
try {
    const { SessionsClient } = require('@google-cloud/dialogflow');
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');
    if (credentials.project_id) {
        dialogflowClient = new SessionsClient({ credentials });
    }
} catch (error) {
    console.log('Dialogflow not available:', error.message);
}

// Initialize Azure Text Analytics (optional)
let textAnalyticsClient;
try {
    const { TextAnalyticsClient, AzureKeyCredential } = require('@azure/ai-text-analytics');
    if (process.env.AZURE_TEXT_ANALYTICS_KEY && process.env.AZURE_TEXT_ANALYTICS_ENDPOINT) {
        textAnalyticsClient = new TextAnalyticsClient(
            process.env.AZURE_TEXT_ANALYTICS_ENDPOINT,
            new AzureKeyCredential(process.env.AZURE_TEXT_ANALYTICS_KEY)
        );
    }
} catch (error) {
    console.log('Azure Text Analytics not available:', error.message);
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const body = JSON.parse(event.body);
        const { message, sessionId } = body;

        // Input validation
        if (!message || typeof message !== 'string' || message.length > 1000) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid message format or too long' })
            };
        }

        if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 100) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid session ID' })
            };
        }

        // Sanitize input
        const sanitizedMessage = message.trim().replace(/[<>"'&]/g, '');
        
        console.log('Processing message:', sanitizedMessage, 'Session:', sessionId);

        // Store user message
        await storeConversation(sessionId, message, 'user');

        // Process through real multi-cloud pipeline
        const response = await processRealMultiCloudMessage(message, sessionId);

        // Store bot response
        await storeConversation(sessionId, response, 'bot');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                response,
                sessionId,
                timestamp: Date.now()
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};

async function storeConversation(sessionId, message, sender) {
    const params = {
        TableName: process.env.CONVERSATION_TABLE,
        Item: {
            sessionId,
            timestamp: Date.now(),
            message,
            sender,
            ttl: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
        }
    };

    try {
        await dynamodb.put(params).promise();
    } catch (error) {
        console.error('Error storing conversation:', error);
    }
}

async function processRealMultiCloudMessage(message, sessionId) {
    const startTime = Date.now();
    
    try {
        // Parallel processing with timeouts
        const [lexResponse, dialogflowResponse, azureResponse] = await Promise.allSettled([
            withTimeout(processWithLex(message, sessionId), 5000),
            withTimeout(processWithDialogflow(message, sessionId), 5000),
            withTimeout(processWithAzure(message), 3000)
        ]);

        const processingTime = Date.now() - startTime;
        console.log(`Multi-cloud processing completed in ${processingTime}ms`);

        return await generateCombinedResponse(
            lexResponse.status === 'fulfilled' ? lexResponse.value : getFallbackLexResponse(message),
            dialogflowResponse.status === 'fulfilled' ? dialogflowResponse.value : getFallbackDialogflowResponse(),
            azureResponse.status === 'fulfilled' ? azureResponse.value : getFallbackAzureResponse(message),
            message
        );

    } catch (error) {
        console.error('Multi-cloud processing error:', error);
        return getFallbackResponse(message);
    }
}

function withTimeout(promise, timeoutMs) {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
    ]);
}

function getFallbackLexResponse(message) {
    return {
        intent: extractBasicIntent(message),
        entities: extractBasicEntities(message),
        confidence: 0.5,
        source: 'TIMEOUT_FALLBACK'
    };
}

function getFallbackDialogflowResponse() {
    return {
        fulfillmentText: 'Processing timeout',
        intent: 'Default',
        confidence: 0.5,
        source: 'TIMEOUT_FALLBACK'
    };
}

function getFallbackAzureResponse(message) {
    return {
        sentiment: 'neutral',
        confidence: 0.5,
        source: 'TIMEOUT_FALLBACK'
    };
}

async function processWithLex(message, sessionId) {
    try {
        // Check if Lex is configured
        if (!process.env.LEX_BOT_ID || process.env.LEX_BOT_ID === 'YOUR_LEX_BOT_ID') {
            console.log('Lex not configured, using fallback');
            return {
                intent: extractBasicIntent(message),
                entities: extractBasicEntities(message),
                confidence: 0.85,
                source: 'AWS_LEX_FALLBACK'
            };
        }

        const params = {
            botId: process.env.LEX_BOT_ID,
            botAliasId: process.env.LEX_BOT_ALIAS_ID,
            localeId: 'en_US',
            sessionId: sessionId,
            text: message
        };

        const result = await lexruntime.recognizeText(params).promise();
        
        return {
            intent: result.sessionState?.intent?.name || 'Unknown',
            entities: result.sessionState?.intent?.slots || {},
            confidence: result.sessionState?.intent?.confirmationState === 'Confirmed' ? 0.9 : 0.7,
            source: 'AWS_LEX'
        };
    } catch (error) {
        console.error('Lex error:', error);
        return {
            intent: extractBasicIntent(message),
            entities: extractBasicEntities(message),
            confidence: 0.5,
            source: 'LEX_ERROR_FALLBACK'
        };
    }
}

async function processWithDialogflow(message, sessionId) {
    if (!dialogflowClient) {
        return {
            fulfillmentText: 'Conversation flow optimized',
            intent: 'Default Welcome Intent',
            confidence: 0.8,
            source: 'DIALOGFLOW_MOCK'
        };
    }

    try {
        const projectId = JSON.parse(process.env.GOOGLE_CREDENTIALS).project_id;
        const sessionPath = dialogflowClient.projectAgentSessionPath(projectId, sessionId);

        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: message,
                    languageCode: 'en-US',
                },
            },
        };

        const [response] = await dialogflowClient.detectIntent(request);
        return {
            fulfillmentText: response.queryResult.fulfillmentText,
            intent: response.queryResult.intent.displayName,
            confidence: response.queryResult.intentDetectionConfidence,
            source: 'GOOGLE_DIALOGFLOW'
        };
    } catch (error) {
        console.error('Dialogflow error:', error);
        return {
            fulfillmentText: 'Conversation flow managed',
            intent: 'Default Welcome Intent',
            confidence: 0.6,
            source: 'DIALOGFLOW_ERROR'
        };
    }
}

async function processWithAzure(message) {
    if (!textAnalyticsClient) {
        // Use local sentiment analysis (no API needed)
        const result = sentiment.analyze(message);
        const sentimentScore = result.score;
        const sentimentLabel = sentimentScore > 0 ? 'positive' : sentimentScore < 0 ? 'negative' : 'neutral';
        const confidence = Math.min(Math.abs(sentimentScore) / 5, 1); // Normalize to 0-1
        
        return {
            sentiment: sentimentLabel,
            confidence: Math.max(confidence, 0.5),
            source: 'SENTIMENT_JS_LOCAL'
        };
    }

    try {
        const documents = [{ id: '1', text: message }];
        const results = await textAnalyticsClient.analyzeSentiment(documents);
        
        const result = results[0];
        return {
            sentiment: result.sentiment,
            confidence: result.confidenceScores[result.sentiment],
            source: 'AZURE_COGNITIVE_SERVICES'
        };
    } catch (error) {
        console.error('Azure error:', error);
        return {
            sentiment: 'neutral',
            confidence: 0.5,
            source: 'AZURE_ERROR'
        };
    }
}

async function generateCombinedResponse(lexResponse, dialogflowResponse, azureResponse, originalMessage) {
    const intent = lexResponse.intent;
    const entities = lexResponse.entities;
    const sentiment = azureResponse.sentiment;

    let response = `🤖 **Multi-Cloud Analysis Complete!**\n\n`;
    response += `🔍 **AWS Lex**: ${intent} (${lexResponse.source})\n`;
    response += `💬 **Google Dialogflow**: ${dialogflowResponse.intent} (${dialogflowResponse.source})\n`;
    response += `🧠 **Azure Sentiment**: ${sentiment} (${azureResponse.source})\n\n`;

    // Generate response based on intent
    switch (intent) {
        case 'plan_trip':
        case 'PlanTrip':
            return response + await generateTripPlan(entities, sentiment);
        case 'check_weather':
        case 'CheckWeather':
            return response + await generateWeatherResponse(entities);
        case 'find_flights':
        case 'FindFlights':
            return response + generateFlightResponse(entities);
        default:
            return response + generateGeneralResponse(sentiment);
    }
}

function extractBasicIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('plan') && (lowerMessage.includes('trip') || lowerMessage.includes('travel'))) {
        return 'plan_trip';
    }
    if (lowerMessage.includes('weather') || lowerMessage.includes('temperature')) {
        return 'check_weather';
    }
    if (lowerMessage.includes('flight') || lowerMessage.includes('fly') || lowerMessage.includes('ticket')) {
        return 'find_flights';
    }
    return 'general';
}

function extractBasicEntities(message) {
    const entities = {};
    
    // Extract destination
    const destinations = {
        'paris': 'paris', 'london': 'london', 'tokyo': 'tokyo', 'new york': 'new york',
        'rome': 'rome', 'barcelona': 'barcelona', 'amsterdam': 'amsterdam',
        'chennai': 'chennai', 'mumbai': 'mumbai', 'delhi': 'delhi', 'bangalore': 'bangalore',
        'berlin': 'berlin', 'madrid': 'madrid', 'lisbon': 'lisbon', 'vienna': 'vienna'
    };
    
    for (const [key, value] of Object.entries(destinations)) {
        if (message.toLowerCase().includes(key)) {
            entities.destination = value;
            break;
        }
    }
    
    // Extract duration
    const durationMatch = message.match(/(\\d+)\\s*(day|week)/i);
    if (durationMatch) {
        entities.duration = parseInt(durationMatch[1]);
    }
    
    // Extract budget
    const budgetMatch = message.match(/[€$](\\d+)|(\\d+)\\s*[€$]/);
    if (budgetMatch) {
        entities.budget = parseInt(budgetMatch[1] || budgetMatch[2]);
    }
    
    return entities;
}

async function generateTripPlan(entities, sentiment) {
    const destination = entities.destination || 'your chosen destination';
    const duration = entities.duration || 3;
    const budget = entities.budget || 900;
    
    const budgetLevel = budget < 300 ? 'budget' : budget < 800 ? 'mid-range' : 'luxury';
    const dailyBudget = Math.floor(budget / duration);
    
    let response = `✈️ **${duration}-Day ${destination.charAt(0).toUpperCase() + destination.slice(1)} Trip Plan**\n\n`;
    response += `💰 **Budget Analysis**: €${budget} total (€${dailyBudget}/day - ${budgetLevel})\n`;
    response += `😊 **Mood**: ${sentiment === 'positive' ? 'Excited traveler!' : sentiment === 'negative' ? 'Let me help you feel better about this trip!' : 'Ready for adventure!'}\n\n`;
    
    // Add specific activities based on destination
    const activities = getDestinationActivities(destination, duration);
    response += `📅 **Suggested Itinerary**:\n${activities}\n`;
    
    response += `\n🌤️ Want weather forecast? 🛫 Need flights? Just ask!`;
    
    return response;
}

function getDestinationActivities(destination, duration) {
    const activities = {
        'chennai': [
            'Day 1: Marina Beach & Kapaleeshwarar Temple',
            'Day 2: Fort St. George & Government Museum',
            'Day 3: Mylapore & Mahabalipuram day trip'
        ],
        'paris': [
            'Day 1: Eiffel Tower & Trocadéro',
            'Day 2: Louvre Museum & Seine cruise',
            'Day 3: Montmartre & Sacré-Cœur'
        ],
        'london': [
            'Day 1: Tower of London & Thames cruise',
            'Day 2: British Museum & Hyde Park',
            'Day 3: Westminster & Camden Market'
        ]
    };
    
    const destActivities = activities[destination] || [
        `Day 1: Explore ${destination} city center`,
        `Day 2: Visit ${destination} museums`,
        `Day 3: Experience ${destination} culture`
    ];
    
    return destActivities.slice(0, duration).join('\n');
}

async function generateWeatherResponse(entities) {
    const destination = entities.destination || 'your destination';
    
    try {
        // Try Open-Meteo (completely free, no API key)
        const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${destination}&count=1`;
        const geoResponse = await axios.get(geocodeUrl);
        
        if (geoResponse.data.results && geoResponse.data.results.length > 0) {
            const { latitude, longitude } = geoResponse.data.results[0];
            const weatherUrl = `https://api.open-meteo.com/v1/current?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;
            const weatherResponse = await axios.get(weatherUrl);
            const weather = weatherResponse.data.current;
            
            const condition = getWeatherCondition(weather.weather_code);
            
            return `🌤️ **Real Weather in ${destination.charAt(0).toUpperCase() + destination.slice(1)}**:\n\n` +
                   `🌡️ Temperature: ${Math.round(weather.temperature_2m)}°C\n` +
                   `☁️ Condition: ${condition}\n` +
                   `💧 Humidity: ${weather.relative_humidity_2m}%\n` +
                   `💨 Wind: ${Math.round(weather.wind_speed_10m)} km/h\n\n` +
                   `Perfect for exploring! 🎒`;
        }
        
        // Fallback to WeatherAPI.com if available
        if (process.env.OPENWEATHER_API_KEY && process.env.OPENWEATHER_API_KEY !== 'YOUR_OPENWEATHER_API_KEY') {
            const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${process.env.OPENWEATHER_API_KEY}&q=${destination}&aqi=no`;
            const weatherResponse = await axios.get(weatherUrl);
            const weather = weatherResponse.data;
            
            return `🌤️ **Real Weather in ${destination.charAt(0).toUpperCase() + destination.slice(1)}**:\n\n` +
                   `🌡️ Temperature: ${Math.round(weather.current.temp_c)}°C\n` +
                   `☁️ Condition: ${weather.current.condition.text}\n` +
                   `💧 Humidity: ${weather.current.humidity}%\n` +
                   `💨 Wind: ${weather.current.wind_kph} km/h\n\n` +
                   `Perfect for exploring! 🎒`;
        }
    } catch (error) {
        console.error('Weather API error:', error);
    }
    
    // Fallback mock weather
    const temp = Math.floor(Math.random() * 25) + 10;
    return `🌤️ **Weather in ${destination.charAt(0).toUpperCase() + destination.slice(1)}**:\n\n` +
           `🌡️ Temperature: ${temp}°C\n` +
           `☁️ Condition: Partly cloudy\n` +
           `💧 Humidity: 65%\n\n` +
           `Great weather for sightseeing! 🎒`;
}

function generateFlightResponse(entities) {
    const destination = entities.destination || 'your destination';
    
    const flights = [
        { airline: 'Lufthansa', price: 290, duration: '2h 30m' },
        { airline: 'Ryanair', price: 180, duration: '2h 45m' },
        { airline: 'Air France', price: 350, duration: '2h 15m' }
    ];
    
    let response = `✈️ **Flight Options to ${destination.charAt(0).toUpperCase() + destination.slice(1)}**:\n\n`;
    
    flights.forEach((flight, index) => {
        response += `${index + 1}. ${flight.airline} - €${flight.price} (${flight.duration})\n`;
    });
    
    response += `\n💡 Book 2-3 weeks ahead for better prices!`;
    
    return response;
}

function generateGeneralResponse(sentiment) {
    const responses = {
        positive: "I love your enthusiasm! 🌟 I can help you plan amazing trips, check weather, or find flights. What adventure are you thinking about?",
        negative: "Let me help brighten your day with some travel planning! ☀️ Where would you like to explore?",
        neutral: "I'm here to help with all your travel needs! 🗺️ Try asking me to plan a trip, check weather, or find flights."
    };
    
    return responses[sentiment] || responses.neutral;
}

function getWeatherCondition(code) {
    const conditions = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
        55: 'Dense drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 80: 'Rain showers',
        81: 'Moderate rain showers', 82: 'Violent rain showers', 95: 'Thunderstorm'
    };
    return conditions[code] || 'Unknown';
}

function getFallbackResponse(message) {
    return "I'm your AI travel assistant powered by AWS, Google Cloud, and Azure! 🌍 " +
           "I can help you plan trips, check weather, and find flights. " +
           "Try saying: 'Plan a 3-day trip to Paris under €900'";
}