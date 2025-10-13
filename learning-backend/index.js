const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

exports.handler = async (event) => {
  // Check authentication
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'Authentication required' }),
    };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  try {
    jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'Invalid or expired token' }),
    };
  }

  const body = JSON.parse(event.body || '{}');
  const question = body.question;
  if (!question) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'No question provided.' })
    };
  }

  // Gemini AI answer
  let answer = '';
  let explanation = '';
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(question);
    const response = await result.response;
    const fullText = response.text();
    // Short answer: first sentence
    answer = fullText.split('. ')[0] + (fullText.includes('.') ? '.' : '');
    // Detailed explanation: split into bullet points
    explanation = fullText.split('. ').map(s => s.trim()).filter(Boolean).map(s => '- ' + s + (s.endsWith('.') ? '' : '.')).join('\n');
  } catch (err) {
    answer = 'Sorry, could not get an answer from Gemini.';
    explanation = err.message;
  }

  // YouTube video suggestions
  let videos = [];
  try {
    const ytRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: question,
        type: 'video',
        maxResults: 3,
        key: YOUTUBE_API_KEY
      }
    });
    videos = ytRes.data.items.map(item => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));
  } catch (err) {
    videos = [];
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
    body: JSON.stringify({
      answer,
      explanation,
      videos
    }, null, 2)
  };
};