// API utility for backend integration
// Update API_BASE_URL to your deployed API Gateway endpoint
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function register(username: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function login(username: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function getPosts(token: string) {
    const res = await fetch(`${API_BASE_URL}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.posts;
}

export async function createPost(token: string, file: File, caption: string) {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", caption);
    const res = await fetch(`${API_BASE_URL}/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function likePost(token: string, postId: string) {
    const res = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function commentPost(token: string, postId: string, text: string) {
    const res = await fetch(`${API_BASE_URL}/posts/${postId}/comment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
