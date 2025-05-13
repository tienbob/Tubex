import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div className="not-found-container text-center">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for does not exist or has been moved.</p>
      <button 
        onClick={() => window.location.href = '/'}
        className="btn btn-primary mt-3"
      >
        Go to Home Page
      </button>
    </div>
  );
};

export default NotFound;
