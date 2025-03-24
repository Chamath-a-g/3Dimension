import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import auth from './firebase';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate(); // Initialize useNavigate

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Login successful - redirect to home page
            navigate('/'); // Redirect to home page after login
        } catch (firebaseError) {
            setError(firebaseError.message);
            console.error("Login Error:", firebaseError);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-white text-center mb-6">Log In</h2>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-bold text-gray-100">Email</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                            placeholder="Your Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-bold text-gray-100">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
                    >
                        Log In
                    </button>
                </form>
                <div className="mt-4 text-sm text-gray-400 text-center">
                    Don't have an account? <Link to="/signup" className="text-blue-500 hover:underline">Sign Up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;