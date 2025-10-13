const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const GEMINI_API_KEY = 'AIzaSyD7iLwiFTKLT--Gx4jW6a219YJ-fH88KWg';
const YOUTUBE_API_KEY = 'AIzaSyDOHBHuzBFhEw6tbmL3IY1VQoL7g-Qp-Co';

async function testGemini() {
  try {
    console.log('Testing Gemini API...');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('What is 2+2?');
    const response = await result.response;
    const answer = response.text();
    console.log('✅ Gemini API works! Answer:', answer);
    return true;
  } catch (err) {
    console.log('❌ Gemini API error:', err.message);
    return false;
  }
}

async function testYouTube() {
  try {
    console.log('Testing YouTube API...');
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: 'math tutorial',
        type: 'video',
        maxResults: 2,
        key: YOUTUBE_API_KEY
      }
    });
    const videos = response.data.items.map(item => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));
    console.log('✅ YouTube API works! Found videos:', videos.length);
    return true;
  } catch (err) {
    console.log('❌ YouTube API error:', err.message);
    return false;
  }
}

async function testAll() {
  const geminiWorks = await testGemini();
  const youtubeWorks = await testYouTube();

  if (geminiWorks && youtubeWorks) {
    console.log('\n🎉 All APIs are working! Ready to deploy.');
  } else {
    console.log('\n⚠️  Some APIs failed. Please check the API keys.');
  }
}

testAll();