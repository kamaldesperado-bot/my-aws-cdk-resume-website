
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import Feed from "./Feed";
import CreatePost from "./CreatePost";
import { auth } from "./firebase";

function App() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <nav style={{ padding: "1em", borderBottom: "1px solid #ccc" }}>
        <Link to="/feed">Feed</Link> | {user ? <Link to="/create">Create Post</Link> : null} | {user ? <span>Logged in</span> : <Link to="/login">Login</Link>} | {!user && <Link to="/register">Register</Link>}
      </nav>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/create" element={user ? <CreatePost /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/feed" />} />
      </Routes>
    </Router>
  );
}

export default App;
