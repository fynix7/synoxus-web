import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Counter from './Counter';
import WorkWithUsModal from './WorkWithUsModal';


const Hero = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { scrollY } = useScroll();
    const rotate1 = useTransform(scrollY, [0, 1000], [187, -13]); // Reversed: Scroll adds CCW (opposite to idle CW)
    const rotate2 = useTransform(scrollY, [0, 1000], [-240, -40]); // Reversed: Scroll adds CW (opposite to idle CCW)
    const rotate3 = useTransform(scrollY, [0, 1000], [60, 260]); // Unchanged
    const rotate4 = useTransform(scrollY, [0, 1000], [85, -115]); // Unchanged

    return (
        <section className="min-h-[135vh] flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 relative overflow-visible">
            {/* Background - Solid black only */}
            <div className="absolute inset-0 w-full h-full pointer-events-none -z-10 bg-[#050505]" />

            {/* Dot Grid Overlay - Above sparkles with increased blur and reduced opacity */}
            <div
                className="absolute inset-0 w-full h-full pointer-events-none z-5 blur-[1px]"
                style={{
                    backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)',
                    backgroundSize: '60px 60px',
                    opacity: '0.154',
                    maskImage: 'radial-gradient(ellipse 1200px 1200px at center, black 0%, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.05) 80%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 1200px 1200px at center, black 0%, rgba(0,0,0,0.8) 20%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.05) 80%, transparent 100%)'
                }}
            />

            {/* Animated Sparkles - Multiple with varying sizes and opacities */}
            {/* Tiny Sparkle - Far Left Top */}
            <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -45 }}
                style={{ rotate: rotate1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.6, ease: "easeOut", delay: 0.5 }}
                className="absolute left-[5%] top-[25%] w-32 h-32 pointer-events-none z-0 hidden lg:block blur-sm"
            >
                <div className="absolute inset-0 bg-orange-500/15 blur-[42px] rounded-full" />
                <motion.svg
                    animate={{ rotate: 360 }}
                    transition={{ duration: 63, repeat: Infinity, ease: "linear" }}
                    viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#ff982b] drop-shadow-[0_0_15px_rgba(255,152,43,0.6)] opacity-[0.32]"
                >
                    <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="currentColor" />
                </motion.svg>
            </motion.div>

            {/* Main Sparkle - 2nd from left - LOWERED and SMALLER (35% reduction) */}
            <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -90 }}
                style={{ rotate: rotate2 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute left-[10%] bottom-[8%] w-[17rem] h-[17rem] pointer-events-none z-0 hidden md:block blur-sm"
            >
                <div className="absolute inset-0 bg-orange-500/40 blur-[105px] rounded-full" />
                <motion.svg
                    animate={{ rotate: -360 }}
                    transition={{ duration: 78, repeat: Infinity, ease: "linear" }}
                    viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#ff982b] drop-shadow-[0_0_30px_rgba(255,152,43,0.9)] opacity-[0.63]"
                >
                    <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="currentColor" />
                </motion.svg>
            </motion.div>

            {/* Smaller Sparkle - Top Right */}
            <motion.div
                initial={{ opacity: 0, scale: 0, rotate: 45 }}
                style={{ rotate: rotate3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.8, ease: "easeOut", delay: 0.3 }}
                className="absolute right-[18%] top-[12%] w-48 h-48 pointer-events-none z-0 hidden md:block blur-sm"
            >
                <div className="absolute inset-0 bg-orange-500/20 blur-[63px] rounded-full" />
                <motion.svg
                    animate={{ rotate: 360 }}
                    transition={{ duration: 69, repeat: Infinity, ease: "linear" }}
                    viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#ffc972] drop-shadow-[0_0_20px_rgba(255,201,114,0.7)] opacity-[0.40]"
                >
                    <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="currentColor" />
                </motion.svg>
            </motion.div>

            {/* Medium Sparkle - Right Bottom */}
            <motion.div
                initial={{ opacity: 0, scale: 0, rotate: 90 }}
                style={{ rotate: rotate4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                className="absolute right-[10%] bottom-[25%] w-56 h-56 pointer-events-none z-0 hidden md:block blur-sm"
            >
                <div className="absolute inset-0 bg-orange-500/25 blur-[74px] rounded-full" />
                <motion.svg
                    animate={{ rotate: -360 }}
                    transition={{ duration: 88, repeat: Infinity, ease: "linear" }}
                    viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#ff982b] drop-shadow-[0_0_25px_rgba(255,152,43,0.8)] opacity-[0.47]"
                >
                    <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="currentColor" />
                </motion.svg>
            </motion.div>

            {/* Text Glow Effect - Behind text for visual interest */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-30 blur-[120px]">
                <div className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter max-w-7xl leading-[1.1] text-orange-400">
                    30+ High-Ticket Leads in the next 90 Days Or You Don't Pay.
                </div>
            </div>

            <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter max-w-7xl mb-6 leading-[1.2] relative z-10 overflow-visible px-2"
            >
                <span className="bg-gradient-to-b from-[#ff982b] to-[#ffc972] bg-clip-text text-transparent overflow-visible inline-block px-1 pb-1"><Counter from={0} to={30} />+</span> <span className="font-light bg-gradient-to-b from-[#ff982b] to-[#ffc972] bg-clip-text text-transparent overflow-visible inline-block px-1 pb-1">High-Ticket Leads in the next</span> <span className="bg-gradient-to-b from-[#ff982b] to-[#ffc972] bg-clip-text text-transparent overflow-visible inline-block px-1 pb-1">90 Days</span> <span className="font-light text-[#fcf0d4] overflow-visible inline-block px-1 pb-1">Or You Don't Pay.</span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-2xl font-light tracking-tight bg-gradient-to-b from-[#f7f4ed] to-[#ffffff] bg-clip-text text-transparent max-w-4xl mb-10 relative z-10 opacity-80"
            >
                If we don't achieve this in 90 days we work for free until we do.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="flex flex-col items-center gap-12"
            >
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group relative overflow-hidden inline-flex items-center gap-2 bg-gradient-to-b from-[#ff982b] to-[#ffc972] text-[#050505] px-8 py-4 rounded-xl text-lg font-semibold hover:scale-110 transition-all shadow-[0_0_20px_rgba(255,152,43,0.3)] hover:shadow-[0_0_30px_rgba(255,152,43,0.5)] cursor-pointer"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        Work with Us
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-0 group-hover:duration-500 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </button>
            </motion.div>

            <WorkWithUsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </section>
    );
};

export default Hero;
