import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle } from 'lucide-react';
import caireLogo from '../assets/caire.png';
import { api } from '../services/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  // Trigger animations on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(username, password);
      
      if (response.success) {
        // Store user info
        localStorage.setItem('user', JSON.stringify(response.user));
        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Left Side - Branding */}
      <div style={{
        ...styles.leftSide,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(-50px)',
        transition: 'all 0.8s ease-out',
      }}>
        <div style={styles.brandingContent}>
          <img 
            src={caireLogo} 
            alt="CAIRE Logo" 
            style={{
              ...styles.logo,
              animation: 'pulse 2s ease-in-out infinite',
            }} 
          />
          <h1 style={styles.brandTitle}>CAIRE</h1>
          <p style={styles.brandSubtitle}>Fall Detection System</p>
          <div style={styles.features}>
            <div style={{
              ...styles.feature,
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(-30px)',
              transition: 'all 0.6s ease-out 0.3s',
            }}>
              <div style={styles.featureIcon}>✓</div>
              <span>Real-time monitoring</span>
            </div>
            <div style={{
              ...styles.feature,
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(-30px)',
              transition: 'all 0.6s ease-out 0.5s',
            }}>
              <div style={styles.featureIcon}>✓</div>
              <span>AI-powered detection</span>
            </div>
            <div style={{
              ...styles.feature,
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(-30px)',
              transition: 'all 0.6s ease-out 0.7s',
            }}>
              <div style={styles.featureIcon}>✓</div>
              <span>Instant alerts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div style={styles.rightSide}>
        <div style={{
          ...styles.formContainer,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease-out 0.3s',
        }}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Welcome Back</h2>
            <p style={styles.formSubtitle}>Please login to continue</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Error Message */}
            {error && (
              <div style={styles.errorBox}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  style={styles.input}
                  required
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={styles.input}
                  required
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              style={{
                ...styles.loginButton,
                ...(loading ? styles.loginButtonDisabled : {})
              }}
              disabled={loading}
              onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>

      {/* Inject keyframes for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 8px 12px rgba(0,0,0,0.15));
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100%',
  },
  
  // Left Side - Branding (PURPLE GRADIENT BACK!)
  leftSide: {
    flex: 1,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  brandingContent: {
    textAlign: 'center',
    color: '#ffffff',
    zIndex: 1,
    padding: '40px',
  },
  logo: {
    width: '120px',
    height: '120px',
    marginBottom: '20px',
  },
  brandTitle: {
    fontSize: '56px',
    fontWeight: '700',
    margin: '0 0 10px 0',
    letterSpacing: '2px',
    textShadow: '0 2px 10px rgba(0,0,0,0.2)',
  },
  brandSubtitle: {
    fontSize: '20px',
    margin: '0 0 50px 0',
    opacity: 0.9,
    fontWeight: '300',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginTop: '40px',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    fontSize: '18px',
    fontWeight: '300',
  },
  featureIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    backdropFilter: 'blur(10px)',
  },
  
  // Right Side - Form
  rightSide: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '50px',
    width: '100%',
    maxWidth: '450px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
  },
  formHeader: {
    marginBottom: '40px',
    textAlign: 'center',
  },
  formTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#2c3e50',
    margin: '0 0 10px 0',
  },
  formSubtitle: {
    fontSize: '15px',
    color: '#7f8c8d',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    border: '1px solid #fcc',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: '#95a5a6',
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    fontSize: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    outline: 'none',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
  },
  loginButton: {
    padding: '16px',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '10px',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
  },
  loginButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

export default Login;