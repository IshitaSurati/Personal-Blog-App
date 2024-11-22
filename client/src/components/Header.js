import React from 'react';
import { Link } from 'react-router-dom';
import "../style/styles.css";
function Header() {
  return (
    <header className="header">
      <div className="left">
        <Link to="/">My Blog</Link>
      </div>
      <div className="right">
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
        <Link to="/create">Create Post</Link>
        <Link to="/logout">Logout</Link>
      </div>
    </header>
  );
}

export default Header;
