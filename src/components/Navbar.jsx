import React from 'react';
import { motion } from 'framer-motion';
import Counter from './Counter';

const Navbar = () => {
    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4"
        >
            <div className="bg-surface/80 backdrop-blur-md border border-white/5 rounded-xl px-10 py-5 flex flex-col items-center justify-center shadow-lg w-fit transition-transform duration-700 ease-in-out hover:scale-[1.03]">
                <span className="text-sm font-medium mb-2 tracking-wider uppercase bg-gradient-to-b from-[#f7f4ed] to-[#ffffff] bg-clip-text text-transparent">Client Results:</span>
                <div className="flex items-center gap-12">
                    <div className="group flex flex-col items-center cursor-default transition-all duration-300 hover:scale-110 hover:saturate-125">
                        <span className="text-3xl font-bold bg-[linear-gradient(110deg,#ff982b_0%,#ffc972_45%,#ffffff_50%,#ff982b_55%,#ffc972_100%)] bg-[length:300%_100%] bg-right group-hover:bg-left bg-clip-text text-transparent transition-[background-position] duration-0 group-hover:duration-700 ease-in-out">
                            $<Counter from={0} to={3} />M+
                        </span>
                        <span className="text-sm text-[#fcf0d4] font-light">cash collected</span>
                    </div>
                    <div className="w-px h-12 bg-white/10" />
                    <div className="group flex flex-col items-center cursor-default transition-all duration-300 hover:scale-110 hover:saturate-125">
                        <span className="text-3xl font-bold bg-[linear-gradient(110deg,#ff982b_0%,#ffc972_45%,#ffffff_50%,#ff982b_55%,#ffc972_100%)] bg-[length:300%_100%] bg-right group-hover:bg-left bg-clip-text text-transparent transition-[background-position] duration-0 group-hover:duration-700 ease-in-out">
                            <Counter from={0} to={17} />M+
                        </span>
                        <span className="text-sm text-[#fcf0d4] font-light">views generated</span>
                    </div>
                    <div className="w-px h-12 bg-white/10" />
                    <div className="group flex flex-col items-center cursor-default transition-all duration-300 hover:scale-110 hover:saturate-125">
                        <span className="text-3xl font-bold bg-[linear-gradient(110deg,#ff982b_0%,#ffc972_45%,#ffffff_50%,#ff982b_55%,#ffc972_100%)] bg-[length:300%_100%] bg-right group-hover:bg-left bg-clip-text text-transparent transition-[background-position] duration-0 group-hover:duration-700 ease-in-out">
                            #1
                        </span>
                        <span className="text-sm text-[#fcf0d4] font-light">on Skool</span>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
