import React from 'react';
import { motion } from 'framer-motion';

const ResultsShowcase = () => {
    return (
        <section className="py-20 w-full max-w-5xl px-4 flex flex-col items-center">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-light mb-4 bg-gradient-to-b from-[#ff982b] to-[#ffc972] bg-clip-text text-transparent pb-1">
                    Packaging that drives results
                </h2>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.36 }}
                viewport={{ once: true }}
                className="w-full max-w-4xl"
            >
                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-8">
                    <img
                        src="/nick-saraev-skool.jpg"
                        alt="Nick Saraev Skool Results"
                        className="w-full h-auto object-cover"
                    />
                </div>

                <p className="text-center text-lg md:text-xl text-[#fcf0d4] font-light leading-relaxed max-w-3xl mx-auto opacity-90">
                    Scaled Nick Saraev to #1 on Skool, making $400K/mo across 2 communities. From 64K Subscribers to 230K Subscribers.
                </p>
            </motion.div>
        </section>
    );
};

export default ResultsShowcase;
