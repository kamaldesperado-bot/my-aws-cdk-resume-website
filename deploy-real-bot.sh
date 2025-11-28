#!/bin/bash

# Deploy Real Multi-Cloud Travel Bot
echo "🚀 Deploying Real Multi-Cloud Travel Bot..."

# Set environment variables (replace with your actual keys)
export OPENWEATHER_API_KEY="your_openweather_key_here"
export GOOGLE_CREDENTIALS='{"project_id":"your-project","private_key":"your-key"}'
export AZURE_TEXT_ANALYTICS_KEY="your_azure_key_here"
export AZURE_TEXT_ANALYTICS_ENDPOINT="https://your-region.cognitiveservices.azure.com/"
export LEX_BOT_ID="your_lex_bot_id"
export LEX_BOT_ALIAS_ID="TSTALIASID"

# Build and deploy
npm run build
npx cdk deploy TravelBotStack --profile personal --require-approval never

echo "✅ Real Multi-Cloud Bot Deployed!"
echo "🌍 URL: https://d2d5z0a31znl02.cloudfront.net"