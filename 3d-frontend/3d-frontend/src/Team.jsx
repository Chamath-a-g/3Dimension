import React from 'react';
import { Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SocialIcon } from "react-social-icons"; // Import SocialIcon for Footer



const TeamMember = ({ image, name, role, social }) => {
    return (
        <div
            className="relative group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg p-6 rounded-xl transition-all duration-300 hover:translate-y-[-8px]"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-600/10 to-gray-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <img
                src={image}
                alt={name}
                className="w-32 h-32 rounded-2xl mx-auto mb-4 object-cover ring-2 ring-gray-500/30 group-hover:ring-gray-400 transition-all"
            />
            <h3 className="text-lg font-semibold text-white">{name}</h3>
            <p className="text-gray-300 font-medium">{role}</p>
            <div className="flex justify-center gap-4 mt-4">
                {social.linkedin && (
                    <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-100 transition-colors">
                        <Linkedin size={20} />
                    </a>
                )}
            </div>
            {/* Decorative shapes */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-gray-500/20 rounded-full blur-sm" />
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gray-400/20 rounded-full blur-sm" />
        </div>
    );
};

const Team = () => {
    const teamMembers = [
        {
            image: "/images/team/member1.jpg",
            name: "Bhanuka Wijerathne",
            role: "Team Leader",
            social: {
                linkedin: ""
            }
        },
        {
            image: "/images/team/member2.jpg",
            name: "Chamani Wanniarachchi",
            role: "Backend and Technical Developer",
            social: {
                linkedin: ""
            }
        },
        {
            image: "/images/team/member3.jpg",
            name: "Pubudu Vithanage",
            role: "3D Developer",
            social: {
                linkedin: ""
            }
        },
        {
            image: "/images/team/member4.jpg",
            name: "Chamath Gunasekara",
            role: "Frontend and Technical Developer",
            social: {
                linkedin: ""
            }
        },
        {
            image: "/images/team/member5.jpg",
            name: "Imashi Ariyasinghe",
            role: "Automation And Technical Developer",
            social: {
                linkedin: ""
            }
        },
        {
            image: "/images/team/member6.jpg",
            name: "Nithika Wikramasinghe",
            role: "Technical and Automation developer",
            social: {
                linkedin: ""
            }
        }
    ];

    return (
        <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-16">
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

            <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-16">
                {/* Decorative shapes */}
                <div className="absolute top-20 left-0 w-64 h-64 bg-gray-500/10 rounded-full blur-3xl" />
                <div className="absolute top-40 right-0 w-96 h-96 bg-gray-400/10 rounded-full blur-3xl" />

                {/* Team Header */}
                <section className="relative py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-5xl font-bold text-center text-white mb-6">Our Team</h1>
                        <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto mb-16">
                            Meet the passionate experts behind 3Dimension who are revolutionizing architectural visualization
                        </p>
                    </div>
                </section>

                {/* Team Grid */}
                <section className="relative py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {teamMembers.map((member, index) => (
                                <TeamMember key={index} {...member} />
                            ))}
                        </div>
                    </div>
                </section>
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

export default Team;