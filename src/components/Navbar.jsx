import React from 'react';
import { motion } from 'framer-motion';
import Counter from './Counter';

const Navbar = () => {
    const [initialShine, setInitialShine] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setInitialShine(true);
            setTimeout(() => setInitialShine(false), 1000); // Reset after animation
        }, 2500); // Trigger after initial slide-in
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 1.7 }}
            className="fixed top-4 left-4 z-50 origin-top-left will-change-transform pointer-events-none"
        >
            <div className="group relative overflow-hidden bg-gradient-to-b from-[#ff982b]/95 to-[#ffc972]/95 border border-white/20 rounded-xl px-6 py-4 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(255,152,43,0.3)] w-[30rem] transition-transform duration-700 ease-in-out hover:scale-[1.03] pointer-events-auto">
                <span className="text-sm font-bold mb-2 tracking-wider uppercase text-[#0f0f0f]/80 relative z-10">Client Results:</span>
                <div className="flex items-center justify-between w-full relative z-10 px-2">
                    <div className="group/item flex flex-col items-center cursor-default transition-all duration-300 hover:scale-110 hover:saturate-125">
                        <span className="text-4xl font-bold leading-none mb-[-2px] bg-[linear-gradient(110deg,#0f0f0f_0%,#0f0f0f_45%,#555555_50%,#0f0f0f_55%,#0f0f0f_100%)] bg-[length:300%_100%] bg-right group-hover/item:bg-left bg-clip-text text-transparent transition-[background-position] duration-0 group-hover/item:duration-[1400ms] ease-in-out">
                            $<Counter from={0} to={3} />M+
                        </span>
                        <span className="text-sm text-[#0f0f0f] font-medium mt-1">cash collected</span>
                    </div>
                    <div className="w-px h-12 bg-[#0f0f0f]/20" />
                    <div className="group/item flex flex-col items-center cursor-default transition-all duration-300 hover:scale-110 hover:saturate-125">
                        <span className="text-4xl font-bold leading-none mb-[-2px] bg-[linear-gradient(110deg,#0f0f0f_0%,#0f0f0f_45%,#555555_50%,#0f0f0f_55%,#0f0f0f_100%)] bg-[length:300%_100%] bg-right group-hover/item:bg-left bg-clip-text text-transparent transition-[background-position] duration-0 group-hover/item:duration-[1400ms] ease-in-out">
                            <Counter from={0} to={17} />M+
                        </span>
                        <span className="text-sm text-[#0f0f0f] font-medium mt-1">views generated</span>
                    </div>
                    <div className="w-px h-12 bg-[#0f0f0f]/20" />
                    <div className="group/item flex flex-col items-center cursor-default transition-all duration-300 hover:scale-110 hover:saturate-125">
                        <span className="text-4xl font-bold leading-none mb-[-2px] bg-[linear-gradient(110deg,#0f0f0f_0%,#0f0f0f_45%,#555555_50%,#0f0f0f_55%,#0f0f0f_100%)] bg-[length:300%_100%] bg-right group-hover/item:bg-left bg-clip-text text-transparent transition-[background-position] duration-0 group-hover/item:duration-[1400ms] ease-in-out">
                            #1
                        </span>
                        <span className="text-sm text-[#0f0f0f] font-medium mt-1">on Skool</span>
                    </div>
                </div>
                {/* Shine Effect - One way only + Initial Trigger */}
                <div
                    className={`absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-0 ${initialShine
                        ? 'translate-x-full transition-transform duration-1000 ease-in-out'
                        : 'group-hover:translate-x-full group-hover:transition-transform group-hover:duration-1000 group-hover:ease-in-out'
                        }`}
                />
            </div>
        </motion.nav>
    );
};

export default Navbar;
