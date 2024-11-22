import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../style/styles.css';

function EditPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:4000/post/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setPost(data);
        setTitle(data.title);
        setSummary(data.summary);
        setContent(data.content);
      });
  }, [id]);

  const handleUpdate = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('summary', summary);
    formData.append('content', content);
    if (file) {
      formData.append('file', file);
    }

    fetch(`http://localhost:4000/post/${id}`, {
      method: 'PUT',
      body: formData,
      credentials: 'include',
    }).then((response) => {
      if (response.ok) {
        alert('Post updated');
        navigate(`/post/${id}`);
      }
    });
  };

  if (!post) return <div>Loading...</div>;

  return (
    <form onSubmit={handleUpdate}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />
      <input
        type="text"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Summary"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Content"
      />
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button type="submit">Update Post</button>
    </form>
  );
}

export default EditPost;
