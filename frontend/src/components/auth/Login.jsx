import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './login.css';

export default function Login() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(e.target.email.value, e.target.password.value);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
      console.error(err);
    }
  };

  return (
    <div className="login-bg-centered">
      <div className="login-card">
        <div className="login-logo">TrustLens<span style={{color:'#a78bfa'}}>.AI</span></div>
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Log in to your TrustLens.AI account</p>
        {error && <div className="error-message">{error}</div>}
        <form className="login-form" onSubmit={handleLogin}>
          <label htmlFor="login-email">Email</label>
          <input type="email" id="login-email" name="email" placeholder="hello@example.com" required />

          <label htmlFor="login-password">Password</label>
          <input type="password" id="login-password" name="password" placeholder="Password" required />

          <button type="submit" className="login-btn">Log in</button>
        </form>
        <div className="login-bottom-text">
          Don't have an account?{' '}
          <a href="/signup" className="login-link">Sign up</a>
        </div>
      </div>
    </div>
  );
}