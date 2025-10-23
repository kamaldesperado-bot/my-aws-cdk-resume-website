import React, { useRef, useState } from "react";

interface AdminImageUploadProps {
    onUpload: (file: File, caption: string) => void;
    loading?: boolean;
    error?: string;
}

const AdminImageUpload: React.FC<AdminImageUploadProps> = ({ onUpload, loading, error }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFile) {
            onUpload(selectedFile, caption);
            setCaption("");
        }
    };

    return (
        <form onSubmit={handleUpload} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 max-w-sm mx-auto mt-10">
            <h2 className="text-xl font-bold mb-4 text-center">Upload New Image</h2>
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="mb-4"
            />
            <input
                type="text"
                placeholder="Enter a caption/title"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="mb-4 w-full border rounded px-2 py-1"
            />
            {error && <div className="text-red-500 text-xs mb-4">{error}</div>}
            <button
                type="submit"
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full"
                disabled={loading || !selectedFile}
            >
                {loading ? "Uploading..." : "Upload"}
            </button>
        </form>
    );
};

export default AdminImageUpload;
