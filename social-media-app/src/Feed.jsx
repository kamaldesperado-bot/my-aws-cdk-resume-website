import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    arrayUnion
} from "firebase/firestore";

function CommentList({ postId }) {
    const [comments, setComments] = useState([]);
    useEffect(() => {
        const q = query(collection(db, `posts/${postId}/comments`), orderBy("createdAt", "asc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => doc.data()));
        });
        return () => unsub();
    }, [postId]);
    return (
        <ul>
            {comments.map((c, i) => (
                <li key={i}>{c.text}</li>
            ))}
        </ul>
    );
    // ...existing code...

    function CommentForm({ postId }) {
        const [text, setText] = useState("");
        const [error, setError] = useState("");
        const [loading, setLoading] = useState(false);

        const handleSubmit = async (e) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            try {
                if (!auth.currentUser) throw new Error("You must be logged in to comment.");
                await import("firebase/firestore").then(({ addDoc, collection, serverTimestamp }) =>
                    addDoc(collection(db, `posts/${postId}/comments`), {
                        text,
                        userId: auth.currentUser.uid,
                        createdAt: serverTimestamp()
                    })
                );
                setText("");
            } catch (err) {
                setError(err.message);
            }
            setLoading(false);
        };

        return (
            <form onSubmit={handleSubmit} style={{ marginTop: "0.5em" }}>
                <input
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Add a comment"
                    required
                />
                <button type="submit" disabled={loading}>Comment</button>
                {error && <span style={{ color: "red" }}>{error}</span>}
            </form>
        );
    }
}

export default function Feed() {
    const [posts, setPosts] = useState([]);
    const [likeLoading, setLikeLoading] = useState({});

    useEffect(() => {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    const handleLike = async (postId, likes) => {
        if (!auth.currentUser) return;
        setLikeLoading(l => ({ ...l, [postId]: true }));
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
            likes: arrayUnion(auth.currentUser.uid)
        });
        setLikeLoading(l => ({ ...l, [postId]: false }));
    };

    return (
        <div>
            <h2>Feed</h2>
            {posts.map(post => (
                <div key={post.id} style={{ border: "1px solid #ccc", margin: "1em 0", padding: "1em" }}>
                    <h3>{post.title}</h3>
                    <img src={post.imageUrl} alt={post.title} style={{ maxWidth: "300px" }} />
                    <div>
                        <button
                            onClick={() => handleLike(post.id, post.likes)}
                            disabled={likeLoading[post.id] || (post.likes && post.likes.includes(auth.currentUser?.uid))}
                        >
                            Like
                        </button>
                        <span> Likes: {post.likes ? post.likes.length : 0}</span>
                    </div>
                    <div>
                        <strong>Comments:</strong>
                        <CommentList postId={post.id} />
                        <CommentForm postId={post.id} />
                    </div>
                </div>
            ))}
        </div>
    );
}
