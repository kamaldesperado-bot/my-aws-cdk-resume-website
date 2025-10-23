const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

function response(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        },
        body: JSON.stringify(body),
    };
}

async function getUser(username) {
    const params = {
        TableName: process.env.USERS_TABLE,
        Key: { username },
    };
    const result = await dynamodb.get(params).promise();
    return result.Item;
}

async function putUser(user) {
    const params = {
        TableName: process.env.USERS_TABLE,
        Item: user,
    };
    await dynamodb.put(params).promise();
}

function generateToken(user) {
    return jwt.sign({ username: user.username, isAdmin: user.username === ADMIN_USERNAME }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

module.exports = {
    response,
    getUser,
    putUser,
    generateToken,
    verifyToken,
    bcrypt,
};
