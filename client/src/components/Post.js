import React from 'react';
import { Link } from 'react-router-dom';

export default function Post({_id, title, summary, cover}) {
  return (
    <div className="post-preview">
      <Link to={`/post/${_id}`}>
        <h2>{title}</h2>
      </Link>
      <p>{summary}</p>
    </div>
  );
}
