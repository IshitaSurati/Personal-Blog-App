import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../style/styles.css';

function PostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:4000/post/${id}`)
      .then((response) => response.json())
      .then((data) => setPost(data));
  }, [id]);

  const handleDelete = () => {
    fetch(`http://localhost:4000/post/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    }).then((response) => {
      if (response.ok) {
        alert('Post deleted');
        navigate('/');
      }
    });
  };

  const handleEdit = () => {
    navigate(`/edit/${id}`);
  };

  if (!post) return <div>Loading...</div>;

  return (
    <div className="post-page">
      <h1>{post.title}</h1>
      <p>{post.summary}</p>
      <img src={`http://localhost:4000/${post.cover}`} alt="Cover" />
      <p>{post.content}</p>
      <button onClick={handleEdit}>Edit</button>
      <button onClick={handleDelete} style={{ marginLeft: '10px' }}>
        Delete
      </button>
    </div>
  );
}

export default PostPage;
