import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const images = [
    { src: "/thumbnail1.png", alt: "AI Agents Course Thumbnail" },
    { src: "/analytics1.png", alt: "Video Performance Analytics" },
    { src: "/analytics2.png", alt: "Video Analytics Dashboard" }
];

const PackagingShowcase = () => {
    const [selectedImage, setSelectedImage] = useState(null);

    return (
        <section className="py-20 w-full max-w-5xl px-4">
            <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-light mb-4 bg-gradient-to-b from-[#ff982b] to-[#ffc972] bg-clip-text text-transparent pb-1">
                    Packaging that drives clicks
                </h2>
            </div>

            {/* All 3 images side by side with same height but natural widths */}
            <div className="flex flex-col md:flex-row items-stretch justify-center gap-6">
                {images.map((image, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        viewport={{ once: true }}
                        onClick={() => setSelectedImage(image)}
                        className="flex items-center justify-center rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all cursor-pointer hover:scale-105"
                    >
                        <img
                            src={image.src}
                            alt={image.alt}
                            className="h-64 w-auto object-contain mix-blend-screen opacity-80"
                        />
                    </motion.div>
                ))}
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
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
        </section>
    );
};

export default PackagingShowcase;
