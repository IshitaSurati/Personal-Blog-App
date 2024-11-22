import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../style/styles.css';

function IndexPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/post')
      .then((response) => response.json())
      .then((data) => setPosts(data));
  }, []);

  return (
    <div className="posts-list">
      {posts.map((post) => (
        <div key={post._id} className="post-preview">
          <h2>{post.title}</h2>
          <p>{post.summary}</p>
          <Link to={`/post/${post._id}`}>Read More</Link>
        </div>
      ))}
    </div>
  );
}

export default IndexPage;
