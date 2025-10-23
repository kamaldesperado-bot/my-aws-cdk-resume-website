import React from "react";

export interface PostData {
    id: string;
    author: string;
    imageUrl: string;
    caption?: string;
    createdAt: string;
    likes: number;
    likedByUser: boolean;
    comments: Array<{ id: string; author: string; text: string; createdAt: string }>;
}

interface PostProps {
    post: PostData;
    onLike: (id: string) => void;
    onComment: (id: string, text: string) => void;
}

const Post: React.FC<PostProps> = ({ post, onLike, onComment }) => {
    const [comment, setComment] = React.useState("");

    return (
        <div className="bg-white rounded shadow p-4 mb-6">
            <div className="flex items-center mb-2">
                <span className="font-bold mr-2">{post.author}</span>
                <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</span>
            </div>
            <img src={post.imageUrl} alt="post" className="w-full rounded mb-2" />
            {post.caption && (
                <div className="mb-2 text-lg font-semibold text-gray-800">{post.caption}</div>
            )}
            <div className="flex items-center mb-2">
                <button
                    className={`mr-2 ${post.likedByUser ? "text-blue-600" : "text-gray-400"}`}
                    onClick={() => onLike(post.id)}
                >
                    👍 {post.likes}
                </button>
            </div>
            <div className="mb-2">
                <ul>
                    {post.comments.map((c) => (
                        <li key={c.id} className="text-sm mb-1">
                            <span className="font-semibold">{c.author}:</span> {c.text}
                        </li>
                    ))}
                </ul>
            </div>
            <form
                onSubmit={e => {
                    e.preventDefault();
                    if (comment.trim()) {
                        onComment(post.id, comment);
                        setComment("");
                    }
                }}
                className="flex"
            >
                <input
                    className="flex-1 border rounded-l px-2 py-1 text-sm focus:outline-none"
                    type="text"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                />
                <button
                    className="bg-blue-500 text-white px-3 py-1 rounded-r text-sm"
                    type="submit"
                >
                    💬
                </button>
            </form>
        </div>
    );
};

export default Post;
