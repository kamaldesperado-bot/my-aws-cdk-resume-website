import React from "react";

interface NavbarProps {
    username?: string;
    isAdmin?: boolean;
    onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ username, isAdmin, onLogout }) => (
    <nav className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
        <div className="font-bold text-lg">Social App</div>
        <div className="flex items-center space-x-4">
            {username && <span>Welcome, {username}{isAdmin ? " (Admin)" : ""}</span>}
            {username && (
                <button
                    onClick={onLogout}
                    className="bg-blue-800 hover:bg-blue-900 px-3 py-1 rounded text-sm"
                >
                    Logout
                </button>
            )}
        </div>
    </nav>
);

export default Navbar;
