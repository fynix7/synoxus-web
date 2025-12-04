import React from 'react';
import { motion } from 'framer-motion';

const Testimonials = () => {
    return (
        <section id="testimonials" className="py-20 w-full max-w-6xl px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-light mb-4 bg-gradient-to-b from-[#ff982b] to-[#ffc972] bg-clip-text text-transparent">Testimonials</h2>
                <p className="text-gray-400">What people are saying</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2].map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-surface border border-white/5 rounded-xl p-8"
                    >
                        <p className="text-lg text-gray-300 italic mb-6">"This service completely transformed our business. Highly recommended!"</p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/10" />
                            <div>
                                <h4 className="font-semibold">Client Name</h4>
                                <p className="text-sm text-gray-500">CEO, Company</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Testimonials;
