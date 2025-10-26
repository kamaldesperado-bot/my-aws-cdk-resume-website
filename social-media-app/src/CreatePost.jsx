
import React, { useState } from "react";
import { auth } from "./firebase";

export default function CreatePost() {
    const [title, setTitle] = useState("");
    const [image, setImage] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (!auth.currentUser) throw new Error("You must be logged in to post.");
            if (!image) throw new Error("Please select an image.");

            // Send image and title to backend API for Cloudinary upload
            const formData = new FormData();
            formData.append("image", image);
            formData.append("title", title);
            formData.append("userId", auth.currentUser.uid);

            const response = await fetch("/posts", {
                method: "POST",
                body: formData
            });
            if (!response.ok) throw new Error("Failed to create post");

            setTitle("");
            setImage(null);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Create Post</h2>
            <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title"
                required
            />
            <input
                type="file"
                accept="image/*"
                onChange={e => setImage(e.target.files[0])}
                required
            />
            <button type="submit" disabled={loading}>Post</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
}
