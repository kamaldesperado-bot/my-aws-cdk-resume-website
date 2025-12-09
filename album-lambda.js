const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client();
const BUCKET = 'photos-v2-128945984791-eu-central-1';
const KEY = 'albums/albums.json';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  try {
    if (event.httpMethod === 'GET') {
      try {
        const data = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET, Key: KEY }));
        const body = await data.Body.transformToString();
        return { statusCode: 200, headers, body };
      } catch (err) {
        if (err.name === 'NoSuchKey') {
          return { statusCode: 200, headers, body: JSON.stringify({ albums: [] }) };
        }
        throw err;
      }
    }
    
    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: KEY,
        Body: JSON.stringify(body),
        ContentType: 'application/json'
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }
    
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
