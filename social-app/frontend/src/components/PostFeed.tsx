import React from "react";
import Post from "./Post";
import type { PostData } from "./Post";

interface PostFeedProps {
    posts: PostData[];
    onLike: (id: string) => void;
    onComment: (id: string, text: string) => void;
}

const PostFeed: React.FC<PostFeedProps> = ({ posts, onLike, onComment }) => (
    <div className="max-w-xl mx-auto mt-8">
        {posts.length === 0 ? (
            <div className="text-center text-gray-500">No posts yet.</div>
        ) : (
            posts.map(post => (
                <Post key={post.id} post={post} onLike={onLike} onComment={onComment} />
            ))
        )}
    </div>
);

export default PostFeed;
