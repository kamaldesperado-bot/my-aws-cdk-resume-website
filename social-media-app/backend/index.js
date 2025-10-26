
const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const cloudinary = require('./cloudinary-config');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Upload image and create post (Cloudinary)
app.post('/posts', upload.single('image'), async (req, res) => {
    try {
        const { title, userId } = req.body;
        if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

        // Upload to Cloudinary
        cloudinary.uploader.upload_stream({ resource_type: 'image' }, async (error, result) => {
            if (error) return res.status(500).json({ error: error.message });
            const postRef = await db.collection('posts').add({
                title,
                imageUrl: result.secure_url,
                userId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                likes: [],
            });
            res.json({ id: postRef.id, title, imageUrl: result.secure_url, userId });
        }).end(req.file.buffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Like a post
app.post('/posts/:id/like', async (req, res) => {
    try {
        const { userId } = req.body;
        const postRef = db.collection('posts').doc(req.params.id);
        await postRef.update({ likes: admin.firestore.FieldValue.arrayUnion(userId) });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a comment
app.post('/posts/:id/comments', async (req, res) => {
    try {
        const { userId, text } = req.body;
        const commentRef = await db.collection('posts').doc(req.params.id).collection('comments').add({
            userId,
            text,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.json({ id: commentRef.id, userId, text });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get posts
app.get('/posts', async (req, res) => {
    try {
        const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get comments for a post
app.get('/posts/:id/comments', async (req, res) => {
    try {
        const snapshot = await db.collection('posts').doc(req.params.id).collection('comments').orderBy('createdAt').get();
        const comments = snapshot.docs.map(doc => doc.data());
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
