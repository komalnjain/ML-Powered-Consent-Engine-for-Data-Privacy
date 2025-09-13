import React from 'react';
import { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, registerUser } from '../api/auth';

export const AuthContext = createContext();

// Define the useAuth hook within the same file
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Temporarily disabled backend call as backend is not ready
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with Flask backend
      fetch('/api/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (res.ok) setUser(JSON.parse(localStorage.getItem('user')));
      }).catch(() => {
        // Handle token verification failure, e.g., clear token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Temporarily disabled backend call as backend is not ready
    console.log('Login attempted with:', email, password);
    // Simulate a successful login for now
    
    // const { token, user } = await loginUser(email, password);
    const dummyUser = { id: 1, email: email, name: 'Test User' }; // Create a dummy user object
    const dummyToken = 'simulated-token'; // Create a dummy token

    localStorage.setItem('token', dummyToken);
    localStorage.setItem('user', JSON.stringify(dummyUser));
    setUser(dummyUser); // Set the dummy user in state
    
    return { success: true, user: dummyUser }; // Return success and user
    
    // try {
    //   const { token, user } = await loginUser(email, password);
    //   localStorage.setItem('token', token);
    //   localStorage.setItem('user', JSON.stringify(user));
    //   setUser(user);
    //   return { success: true };
    // } catch (error) {
    //   console.error('Login failed:', error);
    //   // alert('Login simulated. Backend not connected.');
    //   return { success: false, error: error.message || 'Login failed' };
    // }
  };

  const signup = async (userData) => {
    // Temporarily disabled backend call as backend is not ready
    // console.log('Signup attempted with:', userData);
    // Simulate a successful signup for now
    try {
      const { token, user } = await registerUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
       return { success: true };
    } catch (error) {
      console.error('Signup failed:', error);
      // alert('Signup simulated. Backend not connected.');
       return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}