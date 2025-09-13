// src/components/auth/Signup.tsx
import React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

export default function Signup() {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (formData.password.length < 8) newErrors.password = 'Password must be 8+ characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords must match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({}); // Clear previous errors

    try {
      await axios.post('http://localhost:5000/api/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      signup(formData); // Update auth context
      // Optionally navigate or show success message
      alert('Signup successful!'); // Provide feedback
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // Check if the error response and data exist
        if (err.response && err.response.data && err.response.data.error) {
          setErrors({ api: err.response.data.error }); // Set the error message from the backend
        } else {
          setErrors({ api: 'An unexpected error occurred during signup.' });
        }
      } else {
        setErrors({ api: 'An unexpected error occurred.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    console.log('Input change detected!', e.target.name, e.target.value);
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    console.log('formData after update:', { ...formData, [name]: value });
    // Clear specific error when input changes
    if (errors[name]) {
      setErrors({ ...errors, [name]: undefined });
    }
    // Clear API error when input changes after a submission failure
    if (errors.api) {
      setErrors({ ...errors, api: undefined });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="auth-container signup-form-container"
    >
      <h2>Create Account on TrustLens.AI</h2>
      <p className="subheading">Join us to manage your app permissions.</p>
      
      {errors.api && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-2 bg-red-100 text-red-700 rounded"
        >
          {errors.api}
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="signup-name">Full Name</label>
          <input
            id="signup-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
          {errors.name && <p className="error-message">{errors.name}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
          />
          {errors.email && <p className="error-message">{errors.email}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
          />
          {errors.password && <p className="error-message">{errors.password}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="signup-confirmPassword">Confirm Password</label>
          <input
            id="signup-confirmPassword"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
          />
          {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="auth-button"
        >
          {isSubmitting ? 'Creating Account...' : 'Sign Up'}
        </motion.button>
      </form>

      <p className="mt-4 text-center text-sm dark:text-gray-400">
        Already have an account?{' '}
        <a href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
          Log in
        </a>
      </p>
    </motion.div>
  );
}