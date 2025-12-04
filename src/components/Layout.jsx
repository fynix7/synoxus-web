import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-white font-['Inter',sans-serif] relative">
            {/* Global Dot Grid Overlay - Spaced apart dots with enhanced radial fade and blur */}
            <div
                className="fixed inset-0 w-full h-full pointer-events-none z-5 blur-[1px]"
                style={{
                    backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)',
                    backgroundSize: '60px 60px',
                    opacity: '0.205',
                    maskImage: 'radial-gradient(ellipse 1200px 1200px at center, black 0%, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.05) 80%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 1200px 1200px at center, black 0%, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.05) 80%, transparent 100%)'
                }}
            />
            <Navbar />
            <main className="flex flex-col items-center w-full relative z-10">
                {children}
            </main>
        </div>
    );
};

export default Layout;
