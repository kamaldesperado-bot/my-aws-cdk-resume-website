import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import AuthForm from "./components/AuthForm";
import PostFeed from "./components/PostFeed";
import AdminImageUpload from "./components/AdminImageUpload";
import type { PostData } from "./components/Post";

import * as api from "./api";

const ADMIN_USERNAME = "admin";

function App() {
  const [user, setUser] = useState<{ username: string; isAdmin: boolean; token: string } | null>(null);
  const [authType, setAuthType] = useState<"login" | "register">("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | undefined>();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | undefined>();
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>();

  // Load user from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch { }
    }
  }, []);

  // Fetch posts when logged in
  useEffect(() => {
    if (user) {
      setPostsLoading(true);
      api.getPosts(user.token)
        .then(setPosts)
        .catch(e => setPostsError(e.message))
        .finally(() => setPostsLoading(false));
    } else {
      setPosts([]);
    }
  }, [user]);

  const handleAuth = async ({ username, password }: { username: string; password: string }) => {
    setAuthLoading(true);
    setAuthError(undefined);
    try {
      let data;
      if (authType === "login") {
        data = await api.login(username, password);
      } else {
        data = await api.register(username, password);
      }
      setUser({ username: data.username, isAdmin: data.username === ADMIN_USERNAME, token: data.token });
      localStorage.setItem("user", JSON.stringify({ username: data.username, isAdmin: data.username === ADMIN_USERNAME, token: data.token }));
    } catch (e: any) {
      setAuthError(e.message || "Auth failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const handleLike = async (id: string) => {
    if (!user) return;
    try {
      await api.likePost(user.token, id);
      // Refresh posts
      const updated = await api.getPosts(user.token);
      setPosts(updated);
    } catch (e: any) {
      alert(e.message || "Failed to like post");
    }
  };

  const handleComment = async (id: string, text: string) => {
    if (!user) return;
    try {
      await api.commentPost(user.token, id, text);
      // Refresh posts
      const updated = await api.getPosts(user.token);
      setPosts(updated);
    } catch (e: any) {
      alert(e.message || "Failed to comment");
    }
  };

  const handleUpload = async (file: File, caption: string) => {
    if (!user) return;
    setUploadLoading(true);
    setUploadError(undefined);
    try {
      await api.createPost(user.token, file, caption);
      // Refresh posts
      const updated = await api.getPosts(user.token);
      setPosts(updated);
    } catch (e: any) {
      setUploadError(e.message || "Failed to upload");
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={user?.username} isAdmin={user?.isAdmin} onLogout={handleLogout} />
      <main className="max-w-2xl mx-auto p-4">
        {!user ? (
          <div>
            <AuthForm type={authType} onSubmit={handleAuth} loading={authLoading} error={authError} />
            <div className="text-center">
              <button
                className="text-blue-600 underline text-sm"
                onClick={() => setAuthType(authType === "login" ? "register" : "login")}
              >
                {authType === "login" ? "Need an account? Register" : "Already have an account? Login"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {user.isAdmin && <AdminImageUpload onUpload={handleUpload} loading={uploadLoading} error={uploadError} />}
            {postsLoading ? (
              <div className="text-center text-gray-500">Loading posts...</div>
            ) : postsError ? (
              <div className="text-center text-red-500">{postsError}</div>
            ) : (
              <PostFeed posts={posts} onLike={handleLike} onComment={handleComment} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
