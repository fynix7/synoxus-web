import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';
import Counter from './Counter';
const Hero = ({ onOpenChat }) => {
    const { scrollY } = useScroll();
    const rotate1 = useTransform(scrollY, [0, 1000], [187, -13]); // Reversed: Scroll adds CCW (opposite to idle CW)
    const rotate2 = useTransform(scrollY, [0, 1000], [-240, -40]); // Reversed: Scroll adds CW (opposite to idle CCW)
    const rotate3 = useTransform(scrollY, [0, 1000], [60, 260]); // Unchanged
    const rotate4 = useTransform(scrollY, [0, 1000], [85, -115]); // Unchanged

    const [videoProgress, setVideoProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const playerRef = React.useRef(null);

    useEffect(() => {
        // Load YouTube API
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        let player;
        let interval;

        window.onYouTubeIframeAPIReady = () => {
            const player = new window.YT.Player('youtube-player', {
                videoId: 'b2zAwB1ZoiY',
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    mute: 1,
                    rel: 0,
                    showinfo: 0,
                    modestbranding: 1,
                    loop: 1,
                    playlist: 'b2zAwB1ZoiY',
                    disablekb: 1,
                    fs: 0
                },
                events: {
                    onReady: (event) => {
                        event.target.playVideo();
                        event.target.mute();
                        playerRef.current = event.target;
                    },
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.PLAYING) {
                            const updateProgress = () => {
                                if (player && player.getCurrentTime) {
                                    const currentTime = player.getCurrentTime();
                                    const duration = player.getDuration();
                                    if (duration) {
                                        setVideoProgress(currentTime / duration);
                                    }
                                    interval = requestAnimationFrame(updateProgress);
                                }
                            };
                            interval = requestAnimationFrame(updateProgress);
                        } else {
                            cancelAnimationFrame(interval);
                        }
                    }
                }
            });
        };

        // If API is already ready (navigated back to page)
        if (window.YT && window.YT.Player) {
            window.onYouTubeIframeAPIReady();
        }

        return () => {
            cancelAnimationFrame(interval);
            if (player && player.destroy) {
                player.destroy();
            }
        };
    }, []);

    const handleProgressBarClick = (e) => {
        if (!playerRef.current) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const duration = playerRef.current.getDuration();
        const currentTime = playerRef.current.getCurrentTime();
        const targetTime = percentage * duration;

        // Only allow seeking backwards
        if (targetTime < currentTime) {
            playerRef.current.seekTo(targetTime, true);
        }
    };

    const toggleAudio = () => {
        if (!playerRef.current) return;

        if (isMuted) {
            playerRef.current.unMute();
            setIsMuted(false);
        } else {
            playerRef.current.mute();
            setIsMuted(true);
        }
    };

    return (
        <section className="min-h-[135vh] flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 relative overflow-visible">
            {/* Background - Solid black only */}
            <div className="absolute inset-0 w-full h-full pointer-events-none -z-10 bg-[#050505]" />

            {/* Dot Grid Overlay - Above sparkles with increased blur and reduced opacity */}
            <div
                className="absolute inset-0 w-full h-full pointer-events-none z-5 blur-[1px] -translate-y-[5vh]"
                style={{
                    backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)',
                    backgroundSize: '60px 60px',
                    opacity: '0.234',
                    maskImage: 'radial-gradient(ellipse 1200px 800px at 50% 50%, black 0%, rgba(0,0,0,0.8) 10%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.05) 80%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 1200px 800px at 50% 50%, black 0%, rgba(0,0,0,0.8) 10%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.05) 80%, transparent 100%)'
                }}
            />

            {/* Sparkles Container with Fade Mask - Expanded vertically and horizontally to prevent clipping */}
            <div className="absolute -top-[7%] -bottom-[20%] -left-[100%] w-[300%] pointer-events-none z-0" style={{ maskImage: 'linear-gradient(to bottom, black 60%, transparent 85%)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 85%)' }}>
                {/* Animated Sparkles - Multiple with varying sizes and opacities */}
                {/* Tiny Sparkle - Far Left Top */}
                <motion.div
                    initial={{ opacity: 0, scale: 0, rotate: -45 }}
                    style={{ rotate: rotate1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.6, ease: "easeOut", delay: 0.5 }}
                    className="absolute left-[35%] top-[25%] w-32 h-32 pointer-events-none z-0 hidden lg:block blur-sm"
                >
                    <div className="absolute inset-0 bg-orange-600/15 blur-[42px] rounded-full" />
                    <motion.svg
                        animate={{ rotate: -360 }}
                        transition={{ duration: 63, repeat: Infinity, ease: "linear" }}
                        viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#ff851b] drop-shadow-[0_0_15px_rgba(255,133,27,0.6)] opacity-[0.32]"
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
                    className="absolute left-[36.6%] bottom-[25%] w-[17rem] h-[17rem] pointer-events-none z-0 hidden md:block blur-sm"
                >
                    <div className="absolute inset-0 bg-orange-600/40 blur-[105px] rounded-full" />
                    <motion.svg
                        animate={{ rotate: 360 }}
                        transition={{ duration: 78, repeat: Infinity, ease: "linear" }}
                        viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#ff851b] drop-shadow-[0_0_30px_rgba(255,133,27,0.9)] opacity-[0.63]"
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
                    className="absolute right-[39.3%] top-[12%] w-48 h-48 pointer-events-none z-0 hidden md:block blur-sm"
                >
                    <div className="absolute inset-0 bg-orange-600/20 blur-[63px] rounded-full" />
                    <motion.svg
                        animate={{ rotate: 360 }}
                        transition={{ duration: 69, repeat: Infinity, ease: "linear" }}
                        viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#ffb04f] drop-shadow-[0_0_20px_rgba(255,176,79,0.7)] opacity-[0.40]"
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
                    className="absolute right-[36.6%] bottom-[35%] w-56 h-56 pointer-events-none z-0 hidden md:block blur-sm"
                >
                    <div className="absolute inset-0 bg-orange-500/25 blur-[74px] rounded-full" />
                    <motion.svg
                        animate={{ rotate: -360 }}
                        transition={{ duration: 88, repeat: Infinity, ease: "linear" }}
                        viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#ffb04f] drop-shadow-[0_0_25px_rgba(255,176,79,0.7)] opacity-[0.40]"
                    >
                        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="currentColor" />
                    </motion.svg>
                </motion.div>
            </div>

            {/* Text Glow Effect - Behind text for visual interest */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-30 blur-[120px]">
                <div className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter max-w-7xl leading-[1.1] text-orange-400">
                    30+ High-Ticket Leads in the next 90 Days Or You Don't Pay.
                </div>
            </div>

            <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.48 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter max-w-7xl mb-5 leading-[1.0] relative z-10 overflow-visible px-2 -mt-[2vh]"
            >
                <span className="bg-gradient-to-b from-[#ff982b] to-[#ffc972] bg-clip-text text-transparent overflow-visible inline-block px-1 pb-3"><Counter from={0} to={30} />+</span> <span className="font-light bg-gradient-to-b from-[#ff982b] to-[#ffc972] bg-clip-text text-transparent overflow-visible inline-block px-1 pb-3">High-Ticket Leads in the next</span> <span className="bg-gradient-to-b from-[#ff982b] to-[#ffc972] bg-clip-text text-transparent overflow-visible inline-block px-1 pb-3">90 Days</span> <span className="font-light text-[#fcf0d4] overflow-visible inline-block px-1 pb-3">Or You Don't Pay.</span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.48 }}
                className="text-2xl font-light tracking-tight bg-gradient-to-b from-[#f7f4ed] to-[#ffffff] bg-clip-text text-transparent max-w-4xl mb-10 relative z-10 opacity-80"
            >
                If we don't achieve this in 90 days we work for free until we do.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.48 }}
                className="w-full flex flex-col items-center gap-12 relative z-20"
            >
                {/* Video Box */}
                <div className="relative w-full max-w-3xl aspect-video rounded-2xl shadow-[0_0_30px_rgba(255,152,43,0.15)] overflow-hidden group bg-black transition-transform duration-700 ease-out hover:scale-[1.04]">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300%] pointer-events-none [&>iframe]:w-full [&>iframe]:h-full">
                        <div id="youtube-player" className="w-full h-full" />
                    </div>

                    {/* Audio Control Overlay */}
                    <div
                        onClick={toggleAudio}
                        className="absolute inset-0 z-20 cursor-pointer"
                    >
                        <div className="absolute top-6 right-6 flex flex-row items-center gap-3 z-30 group-hover:scale-110 transition-transform">
                            {isMuted && (
                                <span className="text-[#fcf0d4] text-sm font-medium bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm whitespace-nowrap">
                                    Click for audio
                                </span>
                            )}
                            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10 text-white hover:bg-[#ff982b] hover:text-black transition-colors">
                                {isMuted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
                            </div>
                        </div>
                    </div>

                    {/* Dark Overlay (Optional - kept light to see video) */}
                    <div className="absolute inset-0 bg-black/10 pointer-events-none" />

                    {/* Gradient Border Overlay */}
                    <div
                        className="absolute inset-0 rounded-2xl pointer-events-none z-20"
                        style={{
                            padding: '2px',
                            background: 'linear-gradient(to bottom, #ff982b, #ffc972)',
                            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            maskComposite: 'exclude',
                            WebkitMaskComposite: 'xor'
                        }}
                    />

                    {/* Custom Retention Progress Bar */}
                    <div
                        className="absolute bottom-0 left-0 right-0 h-4 bg-white/10 z-30 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent toggling audio when clicking progress bar
                            handleProgressBarClick(e);
                        }}
                    >
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#ffc972] to-[#ff982b] shadow-[0_0_10px_rgba(255,152,43,0.5)]"
                            style={{
                                width: `${Math.pow(videoProgress, 0.4) * 100}%`, // Non-linear curve for "retention" feel
                            }}
                        />
                    </div>
                </div>

                <motion.button
                    onClick={() => onOpenChat('qualification')}
                    variants={{
                        idle: {
                            scale: [1, 1.04, 1],
                            transition: {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                repeatDelay: 3
                            }
                        },
                        hover: {
                            scale: [1.1, 1.14, 1.1],
                            filter: "saturate(1.15)",
                            transition: {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                repeatDelay: 3
                            }
                        }
                    }}
                    initial="idle"
                    animate="idle"
                    whileHover="hover"
                    className="group relative overflow-hidden inline-flex items-center gap-2 bg-gradient-to-b from-[#ff982b] to-[#ffc972] text-[#050505] px-12 py-6 rounded-xl text-xl font-semibold transition-shadow shadow-[0_0_20px_rgba(255,152,43,0.3)] hover:shadow-[0_0_30px_rgba(255,152,43,0.5)] cursor-pointer will-change-transform [backface-visibility:hidden]"
                >
                    <span className="relative z-10 flex items-center gap-2 uppercase tracking-wide">
                        Work with Us
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-0 group-hover:duration-500 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </motion.button>
            </motion.div>

        </section >
    );
};

export default Hero;
