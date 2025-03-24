import React from 'react';
import { Phone, Mail, MapPin, Clock, Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SocialIcon } from "react-social-icons"; // ADD THIS IMPORT STATEMENT

const Contact = () => {
    const contactInfo = [
        {
            icon: <Phone size={24} />,
            title: 'Phone',
            details: '+94 779 078 188'
        },
        {
            icon: <Mail size={24} />,
            title: 'Email',
            details: '3dimension25tech@gmail.com',
            link: 'mailto:3dimension25tech@gmail.com'
        },
        {
            icon: <MapPin size={24} />,
            title: 'Office',
            details: 'Colombo, Sri Lanka'
        },
        {
            icon: <Clock size={24} />,
            title: 'Business Hours',
            details: 'Mon-Fri: 9:00 AM - 6:00 PM'
        }
    ];

    const socialLinks = [
        {
            platform: 'Instagram',
            url: 'https://www.instagram.com/3dimension1.0/',
            icon: <Instagram size={24} />,
            color: 'hover:text-pink-400'
        },
        {
            platform: 'LinkedIn',
            url: 'https://www.linkedin.com/company/3dimension1-0',
            icon: <Linkedin size={24} />,
            color: 'hover:text-blue-400'
        }
    ];

    return (
        <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-slate-900 to-blue-900">
            {/* Header - ADDED HEADER HERE */}
            <header className="flex justify-between items-center bg-slate-900 text-white p-4">
                <div className="flex items-center space-x-4">
                    <img src="/Logo.png" alt="Logo" className="w-28 h-20" />
                    <span className="text-2xl font-bold text-white">3Dimension</span>
                </div>

                <nav className="flex space-x-8">
                    <Link to="/" className="text-white hover:text-blue-300 transition" style={{ color: 'white' }}>Home</Link>
                    <Link to="/services" className="text-white hover:text-blue-300 transition" style={{ color: 'white' }}>Services</Link>
                    <Link to="/about" className="text-white hover:text-blue-300 transition" style={{ color: 'white' }}>About Us</Link>
                    <Link to="/team" className="text-white hover:text-blue-300 transition" style={{ color: 'white' }}>Project Team</Link>
                    <Link to="/contact" className="text-white hover:text-blue-300 transition" style={{ color: 'white' }}>Contact Us</Link>
                </nav>

                {/* Combined Login/Signup button */}
                <div className="flex space-x-3">
                    <Link to="/signup" className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-full transition" style={{ color: 'white' }}>
                    Login/Signup
                    </Link>
                </div>
            </header>

            <div className="min-h-screen pt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-bold text-gray-100 mb-4">Contact Us</h1>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Get in touch with us. We're here to help and answer any questions you might have.
                        </p>
                    </div>

                    <div className="max-w-2xl mx-auto">
                        {/* Contact Information */}
                        <div className="bg-gray-900/50 backdrop-blur-lg rounded-2xl p-8 space-y-8 border border-gray-800 shadow-xl shadow-blue-900/10">
                            <h2 className="text-2xl font-semibold text-gray-100 mb-6">Contact Information</h2>
                            <div className="space-y-6">
                                {contactInfo.map((info, index) => (
                                    <div key={index} className="flex items-start space-x-4">
                                        <div className="text-blue-400 mt-1">{info.icon}</div>
                                        <div>
                                            <h3 className="text-gray-100 font-medium">{info.title}</h3>
                                            {info.link ? (
                                                <a href={info.link} className="text-gray-400 hover:text-blue-400 transition-colors">
                                                    {info.details}
                                                </a>
                                            ) : (
                                                <p className="text-gray-400">{info.details}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Social Media Links */}
                            <div className="pt-6 border-t border-gray-800">
                                <h3 className="text-gray-100 font-medium mb-4">Connect With Us</h3>
                                <div className="flex space-x-6">
                                    {socialLinks.map((social, index) => (
                                        <a
                                            key={index}
                                            href={social.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`text-gray-400 transition-colors ${social.color} group`}
                                            title={social.platform}
                                        >
                                            <div className="transform transition-transform group-hover:scale-110">
                                                {social.icon}
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer - ADDED FOOTER HERE */}
            <footer className="bg-slate-900 text-white text-center p-6 mt-auto">
                <p>© {new Date().getFullYear()} 3Dimension. All rights reserved.</p>
                <div className="flex justify-center space-x-4 mt-4">
                <SocialIcon url="https://www.instagram.com/3dimension1.0/" bgColor="#6B7280" style={{ height: 35, width: 35 }} target="_blank" />
                <SocialIcon url="https://www.linkedin.com/company/3dimension1-0/" bgColor="#6B7280" style={{ height: 35, width: 35 }} target="_blank" />
                </div>
            </footer>
        </div>
    );
};

export default Contact;