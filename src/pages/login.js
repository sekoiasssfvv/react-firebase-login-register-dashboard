import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import './login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            sessionStorage.setItem('user', JSON.stringify(user));
            alert('Login successful!');
            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            switch (error.code) {
                case 'auth/user-not-found':
                    alert('User not found!');
                    break;
                case 'auth/wrong-password':
                    alert('Incorrect password!');
                    break;
                case 'auth/invalid-email':
                    alert('Invalid email address!');
                    break;
                default:
                    alert(error.message);
            }
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Log In</h2>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="password-input">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? "👁️" : "👁️‍🗨️"}
                        </button>
                    </div>
                </div>
                <button type="submit" className="login-btn">
                    LOGIN
                </button>
                <div className="register-link">
                    Don't have an account? <a href="/register">Sign Up</a>
                </div>
            </form>
        </div>
    );
}

export default Login;