import React from 'react';

const Footer = ({ onEnterPortal }) => {
    return (
        <footer className="w-full py-12 bg-[#050505] border-t border-white/5 relative overflow-hidden z-10">
            <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-6">
                <p className="text-[#52525b] text-sm relative z-20">
                    © {new Date().getFullYear()} Synoxus. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
