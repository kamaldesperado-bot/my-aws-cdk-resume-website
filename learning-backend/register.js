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

    // Check if user already exists
    const existingUser = await dynamodb.get({
      TableName: process.env.USERS_TABLE,
      Key: { username },
    }).promise();

    if (existingUser.Item) {
      return {
        statusCode: 409,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({ error: 'Username already exists' }),
      };
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store user
    await dynamodb.put({
      TableName: process.env.USERS_TABLE,
      Item: {
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      },
    }).promise();

    // Generate JWT token
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        message: 'User registered successfully',
        token,
        username
      }),
    };
  } catch (error) {
    console.error('Registration error:', error);
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