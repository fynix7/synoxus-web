import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MousePointer2, DollarSign } from 'lucide-react';
import Counter from './Counter';

const images = [
    { src: "/thumbnail1.png", alt: "AI Agents Course Thumbnail" },
    { src: "/analytics1.png", alt: "Video Performance Analytics" },
    { src: "/analytics2.png", alt: "Video Analytics Dashboard" }
];



const PackagingSection = () => {
    const [selectedImage, setSelectedImage] = useState(null);

    return (
        <section className="py-24 w-full max-w-7xl px-4 mx-auto flex flex-col items-center">
            {/* Main Header */}
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-light bg-gradient-to-b from-[#ff982b] to-[#ffc972] bg-clip-text text-transparent pb-2">
                    Packaging that
                </h2>
            </div>

            {/* Subsection 1: Drives Clicks */}
            <div className="w-full mb-32">
                <div className="flex items-center justify-center gap-4 mb-12">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#ff982b] to-[#ffc972] flex items-center justify-center shadow-[0_0_15px_rgba(255,152,43,0.4)]">
                        <MousePointer2 className="w-6 h-6 text-[#050505]" />
                    </div>
                    <h3 className="text-3xl md:text-4xl text-white font-light">Drives Clicks</h3>
                </div>

                <div className="flex flex-col md:flex-row items-stretch justify-center gap-6">
                    {images.map((image, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + (index * 0.1) }}
                            viewport={{ once: true }}
                            onClick={() => setSelectedImage(image)}
                            className="flex items-center justify-center rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all cursor-pointer hover:scale-105 bg-[#121212]/30 backdrop-blur-sm"
                        >
                            <img
                                src={image.src}
                                alt={image.alt}
                                className="h-64 w-auto object-contain"
                            />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Subsection 2: Delivers Results */}
            <div className="w-full">
                <div className="flex items-center justify-center gap-4 mb-12">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#ff982b] to-[#ffc972] flex items-center justify-center shadow-[0_0_15px_rgba(255,152,43,0.4)]">
                        <DollarSign className="w-6 h-6 text-[#050505]" />
                    </div>
                    <h3 className="text-3xl md:text-4xl text-white font-light">Delivers Results</h3>
                </div>

                <div className="flex flex-col items-center max-w-5xl mx-auto">
                    {/* Result Images Grid */}
                    <div className="w-full mb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* YouTube Header - Full Width */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.36, delay: 0.3 }}
                            viewport={{ once: true }}
                            onClick={() => setSelectedImage({ src: "/nick-youtube.png", alt: "Nick Saraev YouTube Channel" })}
                            className="md:col-span-3 rounded-2xl overflow-hidden border border-white/10 shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform"
                        >
                            <img
                                src="/nick-youtube.png"
                                alt="Nick Saraev YouTube Channel"
                                className="w-full h-auto object-cover"
                            />
                        </motion.div>

                        {/* Group Photo - Takes 2/3 space */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.36, delay: 0.4 }}
                            viewport={{ once: true }}
                            onClick={() => setSelectedImage({ src: "/nick-saraev-skool.jpg", alt: "Nick Saraev Skool Results" })}
                            className="md:col-span-2 rounded-2xl overflow-hidden border border-white/10 shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform flex items-center bg-[#121212]"
                        >
                            <img
                                src="/nick-saraev-skool.jpg"
                                alt="Nick Saraev Skool Results"
                                className="w-full h-auto object-contain"
                            />
                        </motion.div>

                        {/* Skool Card - Takes 1/3 space */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.36, delay: 0.5 }}
                            viewport={{ once: true }}
                            onClick={() => setSelectedImage({ src: "/maker-school.png", alt: "Maker School Community" })}
                            className="md:col-span-1 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform"
                        >
                            <img
                                src="/maker-school.png"
                                alt="Maker School Community"
                                className="w-full h-auto object-contain"
                            />
                        </motion.div>
                    </div>

                    <p className="text-center text-lg md:text-xl text-[#fcf0d4] font-light leading-relaxed max-w-3xl mx-auto opacity-90 mb-16">
                        Scaled Nick Saraev to #1 on Skool, making $400K/mo across 2 communities. From 64K Subscribers to 230K Subscribers.
                    </p>

                    {/* Integrated Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            viewport={{ once: true }}
                            className="group flex flex-col items-center cursor-default transition-all duration-300 hover:scale-110 hover:saturate-125"
                        >
                            <div className="text-5xl md:text-6xl font-bold bg-[linear-gradient(110deg,#ff982b_0%,#ffc972_45%,#ffffff_50%,#ff982b_55%,#ffc972_100%)] bg-[length:300%_100%] bg-right group-hover:bg-left bg-clip-text text-transparent transition-[background-position] duration-0 group-hover:duration-700 ease-in-out mb-2">
                                $<Counter from={0} to={3} />M+
                            </div>
                            <div className="text-xs text-[#fcf0d4] font-light">cash collected</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            viewport={{ once: true }}
                            className="group flex flex-col items-center cursor-default transition-all duration-300 hover:scale-110 hover:saturate-125"
                        >
                            <div className="text-5xl md:text-6xl font-bold bg-[linear-gradient(110deg,#ff982b_0%,#ffc972_45%,#ffffff_50%,#ff982b_55%,#ffc972_100%)] bg-[length:300%_100%] bg-right group-hover:bg-left bg-clip-text text-transparent transition-[background-position] duration-0 group-hover:duration-700 ease-in-out mb-2">
                                <Counter from={0} to={17} />M+
                            </div>
                            <div className="text-xs text-[#fcf0d4] font-light">views generated</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            viewport={{ once: true }}
                            className="group flex flex-col items-center cursor-default transition-all duration-300 hover:scale-110 hover:saturate-125"
                        >
                            <div className="text-5xl md:text-6xl font-bold bg-[linear-gradient(110deg,#ff982b_0%,#ffc972_45%,#ffffff_50%,#ff982b_55%,#ffc972_100%)] bg-[length:300%_100%] bg-right group-hover:bg-left bg-clip-text text-transparent transition-[background-position] duration-0 group-hover:duration-700 ease-in-out mb-2">
                                #1
                            </div>
                            <div className="text-xs text-[#fcf0d4] font-light">on Skool</div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-pointer"
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 text-white hover:text-orange-400 transition-colors"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            src={selectedImage.src}
                            alt={selectedImage.alt}
                            className="max-w-full max-h-full object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </section >
    );
};

export default PackagingSection;
