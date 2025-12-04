import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Image, Type } from 'lucide-react';

const services = [
    {
        name: "Content Ideation",
        icon: Brain,
        description: "Capture the attention of qualified viewers"
    },
    {
        name: "Thumbnail Design",
        icon: Image,
        description: "Psychologically designed to drive clicks"
    },
    {
        name: "Title Optimization",
        icon: Type,
        description: "Proven outlier formats that perform"
    }
];

const ServiceNotifications = () => {
    return (
        <div className="fixed top-4 right-4 z-[60] flex flex-col gap-4 pointer-events-none">
            {services.map((service, index) => {
                const Icon = service.icon;
                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + (index * 0.2), duration: 0.5, type: "spring" }}
                        whileHover={{ scale: 1.05 }}
                        className="group relative flex items-center gap-6 p-6 rounded-xl border border-white/10 backdrop-blur-xl shadow-2xl w-[32rem] pointer-events-auto cursor-default overflow-hidden"
                    >
                        <div className="absolute top-4 right-4 text-sm font-light text-white/80">
                            now
                        </div>

                        {/* Sparkle for Thumbnail Design */}
                        {service.name === "Thumbnail Design" && (
                            <motion.div
                                className="absolute -left-8 -bottom-8 text-[#ff982b] opacity-30 blur-[15px] pointer-events-none z-0"
                            >
                                <motion.svg
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    width="120" height="120" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                                </motion.svg>
                            </motion.div>
                        )}

                        {/* Sparkle for Title Optimization - Larger and more centered */}
                        {service.name === "Title Optimization" && (
                            <motion.div
                                className="absolute -left-2 -bottom-2 text-[#ff982b] opacity-30 blur-[15px] pointer-events-none z-0"
                            >
                                <motion.svg
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    width="170" height="170" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                                </motion.svg>
                            </motion.div>
                        )}

                        <div className="shrink-0 w-16 h-16 rounded-full bg-gradient-to-b from-[#ff982b] to-[#ffc972] flex items-center justify-center shadow-[0_0_15px_rgba(255,152,43,0.4)] relative z-10">
                            <Icon className="w-8 h-8 text-[#050505]" strokeWidth={2} />
                        </div>
                        <div className="flex-1 pr-6">
                            <h3 className="font-semibold text-lg mb-1 text-white">{service.name}</h3>
                            <p className="text-base text-[#fcf0d4] leading-relaxed">{service.description}</p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default ServiceNotifications;
