
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const {
    response,
    getUser,
    putUser,
    generateToken,
    verifyToken,
    bcrypt,
} = require('./utils');

const USERS_TABLE = process.env.USERS_TABLE;
const POSTS_TABLE = process.env.POSTS_TABLE;
const COMMENTS_TABLE = process.env.COMMENTS_TABLE;
const LIKES_TABLE = process.env.LIKES_TABLE;
const IMAGES_BUCKET = process.env.IMAGES_BUCKET;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const { httpMethod, path } = event;
    if (path.endsWith('/register') && httpMethod === 'POST') {
        return register(event);
    }
    if (path.endsWith('/login') && httpMethod === 'POST') {
        return login(event);
    }
    if (path.endsWith('/logout') && httpMethod === 'POST') {
        return logout(event);
    }
    if (path.endsWith('/posts') && httpMethod === 'GET') {
        return getPosts(event);
    }
    if (path.endsWith('/post') && httpMethod === 'POST') {
        return createPost(event);
    }
    if (path.endsWith('/like') && httpMethod === 'POST') {
        return likePost(event);
    }
    if (path.endsWith('/comment') && httpMethod === 'POST') {
        return commentPost(event);
    }
    return response(404, { message: 'Not found' });
};

// --- Implementations ---
async function register(event) {
    const { username, password } = JSON.parse(event.body || '{}');
    if (!username || !password) return response(400, { message: 'Username and password required' });
    if (await getUser(username)) return response(409, { message: 'User already exists' });
    const hash = await bcrypt.hash(password, 10);
    await putUser({ username, password: hash });
    return response(201, { message: 'User registered' });
}

async function login(event) {
    const { username, password } = JSON.parse(event.body || '{}');
    const user = await getUser(username);
    if (!user) return response(401, { message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return response(401, { message: 'Invalid credentials' });
    const token = generateToken(user);
    return response(200, { username: user.username, token });
}

async function logout(event) {
    // For JWT, logout is handled client-side (token removal)
    return response(200, { message: 'Logged out' });
}

async function getPosts(event) {
    const params = {
        TableName: POSTS_TABLE,
        Limit: 50,
        ScanIndexForward: false,
    };
    const result = await dynamodb.scan(params).promise();
    // Map postId to id for frontend compatibility
    const posts = (result.Items || []).map(post => ({
        id: post.postId,
        imageUrl: post.imageUrl,
        caption: post.caption,
        createdAt: post.createdAt,
        author: post.author,
        likes: post.likes || 0,
        likedByUser: false, // TODO: implement like tracking per user
        comments: [], // TODO: implement comments fetch
    }));
    return response(200, { posts });
}

async function createPost(event) {
    const auth = event.headers.Authorization || event.headers.authorization;
    const user = auth && verifyToken(auth.replace('Bearer ', ''));
    if (!user || !user.isAdmin) return response(403, { message: 'Only admin can post' });

    // Parse multipart/form-data
    const contentType = event.headers['Content-Type'] || event.headers['content-type'] || '';
    if (!contentType.startsWith('multipart/form-data')) {
        return response(400, { message: 'Content-Type must be multipart/form-data' });
    }
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) return response(400, { message: 'Invalid multipart form data' });
    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
    const parts = bodyBuffer.toString().split(`--${boundary}`);
    let fileBuffer = null, fileName = '', caption = '';
    for (const part of parts) {
        if (part.includes('Content-Disposition: form-data;') && part.includes('filename=')) {
            // Extract file
            const match = part.match(/filename="([^"]+)"/);
            if (match) fileName = match[1];
            const fileMatch = part.match(/\r\n\r\n([\s\S]*)\r\n$/);
            if (fileMatch) fileBuffer = Buffer.from(fileMatch[1], 'binary');
        } else if (part.includes('Content-Disposition: form-data;') && part.includes('name="caption"')) {
            // Extract caption
            const match = part.match(/\r\n\r\n([\s\S]*)\r\n$/);
            if (match) caption = match[1].trim();
        }
    }
    if (!fileBuffer || !fileName) return response(400, { message: 'Image file required' });

    // Upload image to S3
    const s3Key = `posts/${uuidv4()}-${fileName}`;
    await s3.putObject({
        Bucket: IMAGES_BUCKET,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: 'image/jpeg', // or detect from fileName
        ACL: 'public-read',
    }).promise();
    const imageUrl = `https://${IMAGES_BUCKET}.s3.amazonaws.com/${s3Key}`;

    const post = {
        postId: uuidv4(),
        imageUrl,
        caption: caption || '',
        createdAt: Date.now(),
        author: user.username,
    };
    await dynamodb.put({ TableName: POSTS_TABLE, Item: post }).promise();
    return response(201, {
        post: {
            id: post.postId,
            imageUrl: post.imageUrl,
            caption: post.caption,
            createdAt: post.createdAt,
            author: post.author,
            likes: 0,
            likedByUser: false,
            comments: [],
        }
    });
}

async function likePost(event) {
    const auth = event.headers.Authorization || event.headers.authorization;
    const user = auth && verifyToken(auth.replace('Bearer ', ''));
    if (!user) return response(401, { message: 'Unauthorized' });
    const { postId } = JSON.parse(event.body || '{}');
    if (!postId) return response(400, { message: 'postId required' });
    const likeId = `${postId}:${user.username}`;
    await dynamodb.put({ TableName: LIKES_TABLE, Item: { likeId, postId, username: user.username, createdAt: Date.now() } }).promise();
    return response(201, { message: 'Liked' });
}

async function commentPost(event) {
    const auth = event.headers.Authorization || event.headers.authorization;
    const user = auth && verifyToken(auth.replace('Bearer ', ''));
    if (!user) return response(401, { message: 'Unauthorized' });
    const { postId, text } = JSON.parse(event.body || '{}');
    if (!postId || !text) return response(400, { message: 'postId and text required' });
    const comment = {
        commentId: uuidv4(),
        postId,
        username: user.username,
        text,
        createdAt: Date.now(),
    };
    await dynamodb.put({ TableName: COMMENTS_TABLE, Item: comment }).promise();
    return response(201, { comment });
}
