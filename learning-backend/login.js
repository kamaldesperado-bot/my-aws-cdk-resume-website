const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use environment variable

exports.handler = async (event) => {
  try {
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({ error: 'Username and password are required' }),
      };
    }

    // Get user from database
    const user = await dynamodb.get({
      TableName: process.env.USERS_TABLE,
      Key: { username },
    }).promise();

    if (!user.Item) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({ error: 'Invalid username or password' }),
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.Item.password);
    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({ error: 'Invalid username or password' }),
      };
    }

    // Generate JWT token
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        message: 'Login successful',
        token,
        username
      }),
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};