import React from 'react';
import { motion } from 'framer-motion';

const categories = ["Motion Graphics", "Youtube & VSL's", "Short Form"];

const projects = [
    { title: "Project 1", category: "Motion Graphics", image: "https://placehold.co/600x400/1a1a1a/ffffff?text=Motion+1" },
    { title: "Project 2", category: "Youtube & VSL's", image: "https://placehold.co/600x400/1a1a1a/ffffff?text=Youtube+1" },
    { title: "Project 3", category: "Short Form", image: "https://placehold.co/600x400/1a1a1a/ffffff?text=Short+1" },
    { title: "Project 4", category: "Motion Graphics", image: "https://placehold.co/600x400/1a1a1a/ffffff?text=Motion+2" },
    { title: "Project 5", category: "Youtube & VSL's", image: "https://placehold.co/600x400/1a1a1a/ffffff?text=Youtube+2" },
    { title: "Project 6", category: "Short Form", image: "https://placehold.co/600x400/1a1a1a/ffffff?text=Short+2" },
];

const Portfolio = () => {
    return (
        <section id="portfolio" className="py-20 w-full max-w-6xl px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-light mb-8 bg-gradient-to-b from-[#ff982b] to-[#ffc972] bg-clip-text text-transparent">Portfolio</h2>
                <div className="flex flex-wrap justify-center gap-4">
                    {categories.map((cat, index) => (
                        <button
                            key={index}
                            className="px-6 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium"
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative aspect-video rounded-xl overflow-hidden bg-surface border border-white/5"
                    >
                        <img
                            src={project.image}
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-semibold">{project.title}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Portfolio;
