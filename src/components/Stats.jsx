import React from 'react';
import { motion } from 'framer-motion';
import Counter from './Counter';

const Stats = () => {
    return (
        <section className="py-20 w-full max-w-6xl px-4">
            <div className="text-center mb-8">
                <h2 className="text-4xl md:text-5xl font-light mb-4 bg-gradient-to-b from-[#ff982b] to-[#ffc972] bg-clip-text text-transparent pb-1">
                    Client results generated
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
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
                    transition={{ delay: 0.1 }}
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
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                    className="group flex flex-col items-center cursor-default transition-all duration-300 hover:scale-110 hover:saturate-125"
                >
                    <div className="text-5xl md:text-6xl font-bold bg-[linear-gradient(110deg,#ff982b_0%,#ffc972_45%,#ffffff_50%,#ff982b_55%,#ffc972_100%)] bg-[length:300%_100%] bg-right group-hover:bg-left bg-clip-text text-transparent transition-[background-position] duration-0 group-hover:duration-700 ease-in-out mb-2">
                        #1
                    </div>
                    <div className="text-xs text-[#fcf0d4] font-light">on Skool</div>
                </motion.div>
            </div>
        </section>
    );
};

export default Stats;
