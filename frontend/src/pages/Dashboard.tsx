declare module '*.jpg';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShield, FiFileText } from 'react-icons/fi';
import '../styles/dashboard.css';
import consentEngineImage from '../assets/image.jpg';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-bg">
      {/* Navbar */}
      <nav className="dashboard-navbar">
        <div className="dashboard-logo">Consent Engine</div>
        <div className="dashboard-nav-btns">
          <button onClick={() => navigate('/risk-analysis')}>Risk Analysis</button>
          <button onClick={() => navigate('/policy-analysis')}>Policy Analysis</button>
          <button onClick={() => navigate('/permission-optimization')}>Permission Optimization</button>
        </div>
        <div className="dashboard-avatar">CE</div>
      </nav>

      {/* Hero Section */}
      <main className="dashboard-hero" style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Left: Welcome Board */}
        <div style={{ flex: 1, minWidth: 320, maxWidth: 600, display: 'flex' }}>
          <div className="dashboard-card" style={{ width: '100%' }}>
            {/* Text */}
            <div className="dashboard-hero-card">
              <h1 className="dashboard-hero-title">
                Welcome to <span className="accent">ML Powered<br />Consent Engine</span>
              </h1>
              <p className="dashboard-hero-desc">
                Your AI-powered platform for privacy risk and policy analysis.<br />
                Upload APKs, analyze privacy policies, and ensure compliance with ease.
              </p>
              <div className="dashboard-hero-btns">
                <button
                  className="dashboard-hero-btn risk"
                  onClick={() => navigate('/risk-analysis')}
                >
                  <FiShield style={{ fontSize: '1.5rem' }} />
                  Risk Analysis
                </button>
                <button
                  className="dashboard-hero-btn policy"
                  onClick={() => navigate('/policy-analysis')}
                >
                  <FiFileText style={{ fontSize: '1.5rem' }} />
                  Policy Analysis
                </button>
                <button
                  className="dashboard-hero-btn risk"
                  onClick={() => navigate('/permission-optimization')}
                >
                  <FiShield style={{ fontSize: '1.5rem' }} />
                  Permission Optimization
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Right: Image */}
        <div style={{ flex: 1, minWidth: 320, maxWidth: 600, display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'stretch' }}>
            <img
              src={consentEngineImage}
              alt="ML-Powered Consent Engine Illustration"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '1.5rem',
                boxShadow: '0 4px 24px 0 rgba(124,58,237,0.10)'
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}