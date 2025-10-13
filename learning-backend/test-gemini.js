const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testGemini() {
  // Try the correct model names from the API
  const models = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-001'];

  for (const modelName of models) {
    try {
      console.log(`Testing model: ${modelName}`);
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('What is 2+2?');
      const response = await result.response;
      const answer = response.text();
      console.log(`Success with ${modelName}! Answer:`, answer);
      return modelName; // Return the working model
    } catch (err) {
      console.log(`Error with ${modelName}:`, err.message);
    }
  }
  console.log('No working model found');
  return null;
}

testGemini().then(workingModel => {
  if (workingModel) {
    console.log(`\nUse this model in your code: '${workingModel}'`);
  }
});