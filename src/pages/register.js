import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './register.css';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebase';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert('The passwords do not match!');
            return;
        }

        try {
            setIsLoading(true);
            await createUserWithEmailAndPassword(auth, email, password);
            await signOut(auth);

            setEmail('');
            setPassword('');
            setConfirmPassword('');

            alert('Registration successful! Please log in.');
            navigate('/login', { replace: true });

        } catch (error) {
            console.error('Registration error:', error);
            switch (error.code) {
                case 'auth/email-already-in-use':
                    alert('This email address is already in use!');
                    break;
                case 'auth/invalid-email':
                    alert('Invalid email address!');
                    break;
                case 'auth/weak-password':
                    alert('The password is too weak!');
                    break;
                default:
                    alert(error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-container">
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                </div>
            )}
            <form className="register-form" onSubmit={handleSubmit}>
                <h2>Sign Up</h2>
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
                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="password-input">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                        </button>
                    </div>
                </div>
                <button type="submit" className="register-btn">
                    CREATE ACCOUNT
                </button>
                <div className="login-link">
                    Do you already have an account? <a href="/login">Log In</a>
                </div>
            </form>
        </div>
    );
}

export default Register;