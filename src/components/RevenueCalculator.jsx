import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { DollarSign, Users, MousePointerClick, TrendingUp } from 'lucide-react';

const RevenueCalculator = () => {
    const [bookedCallsPer100k, setBookedCallsPer100k] = useState(100);
    const [closeRate, setCloseRate] = useState(20);
    const [price, setPrice] = useState(3000);
    const [monthlyViews, setMonthlyViews] = useState(20000);
    const [revenue, setRevenue] = useState(0);

    useEffect(() => {
        const bookedCalls = monthlyViews * (bookedCallsPer100k / 100000);
        const deals = bookedCalls * (closeRate / 100);
        const calculatedRevenue = deals * price;
        setRevenue(calculatedRevenue);
    }, [bookedCallsPer100k, closeRate, price, monthlyViews]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatNumber = (value) => {
        return new Intl.NumberFormat('en-US').format(value);
    };

    return (
        <section className="w-full py-24 bg-[#050505] relative overflow-hidden">
            {/* Dot Grid Overlay - Matching Hero */}
            <div
                className="absolute inset-0 w-full h-full pointer-events-none z-0 blur-[1px]"
                style={{
                    backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)',
                    backgroundSize: '60px 60px',
                    opacity: '0.05',
                    maskImage: 'radial-gradient(ellipse 800px 800px at center, black 0%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 800px 800px at center, black 0%, transparent 100%)'
                }}
            />

            <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <h2 className="text-3xl md:text-4xl font-light mb-4 bg-gradient-to-b from-[#ff982b] to-[#ffc972] bg-clip-text text-transparent pb-1">
                        Calculate Revenue Potential
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Controls */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="space-y-6 bg-[#121212]/50 p-8 rounded-3xl border border-white/10 backdrop-blur-sm h-full flex flex-col justify-center"
                    >
                        {/* Price Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2 text-[#fcf0d4] font-medium">
                                    <DollarSign className="w-5 h-5 text-[#ff982b]" />
                                    Price of Offer
                                </label>
                                <span className="text-white font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                    {formatCurrency(price)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="500"
                                max="20000"
                                step="100"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                className="w-full h-2 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-[#ff982b] hover:accent-[#ffc972] transition-all"
                            />
                            <p className="text-xs text-[#52525b]">How much do you charge per deal?</p>
                        </div>

                        {/* Monthly Views Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2 text-[#fcf0d4] font-medium">
                                    <Users className="w-5 h-5 text-[#ff982b]" />
                                    Monthly Views
                                </label>
                                <span className="text-white font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                    {formatNumber(monthlyViews)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="0.1"
                                value={(Math.log(monthlyViews / 5000) / Math.log(2000)) * 100}
                                onChange={(e) => {
                                    const val = 5000 * Math.pow(2000, e.target.value / 100);
                                    // Round to nice numbers based on magnitude
                                    let rounded;
                                    if (val < 10000) rounded = Math.round(val / 100) * 100;
                                    else if (val < 100000) rounded = Math.round(val / 1000) * 1000;
                                    else rounded = Math.round(val / 10000) * 10000;
                                    setMonthlyViews(rounded);
                                }}
                                className="w-full h-2 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-[#ff982b] hover:accent-[#ffc972] transition-all"
                            />
                            <p className="text-xs text-[#52525b]">How many people see your offer each month?</p>
                        </div>

                        {/* Booked Calls per 100K Views Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2 text-[#fcf0d4] font-medium">
                                    <MousePointerClick className="w-5 h-5 text-[#ff982b]" />
                                    Booked Calls per 100K Views
                                </label>
                                <span className="text-white font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                    {bookedCallsPer100k}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="30"
                                max="1000"
                                step="10"
                                value={bookedCallsPer100k}
                                onChange={(e) => setBookedCallsPer100k(Number(e.target.value))}
                                className="w-full h-2 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-[#ff982b] hover:accent-[#ffc972] transition-all"
                            />
                            <p className="text-xs text-[#52525b]">How many calls do you book per 100,000 views?</p>
                        </div>

                        {/* Close Rate Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2 text-[#fcf0d4] font-medium">
                                    <TrendingUp className="w-5 h-5 text-[#ff982b]" />
                                    Close Rate
                                </label>
                                <span className="text-white font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                    {closeRate}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                step="1"
                                value={closeRate}
                                onChange={(e) => setCloseRate(Number(e.target.value))}
                                className="w-full h-2 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-[#ff982b] hover:accent-[#ffc972] transition-all"
                            />
                            <p className="text-xs text-[#52525b]">Percentage of calls that turn into deals.</p>
                        </div>
                    </motion.div>

                    {/* Result Display */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="relative h-full min-h-[500px] flex flex-col justify-center items-center bg-[#121212]/30 rounded-3xl border border-white/10 p-8 text-center overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#ff982b]/5 to-transparent rounded-3xl pointer-events-none"></div>

                        {/* Big Blurred Sparkle */}
                        <motion.div
                            style={{ rotate: useTransform(useScroll().scrollY, [0, 1000], [0, 200]) }}
                            className="absolute -bottom-20 -right-20 text-[#ff982b] opacity-40 blur-xl pointer-events-none"
                        >
                            <motion.svg
                                animate={{ rotate: 360 }}
                                transition={{ duration: 94, repeat: Infinity, ease: "linear" }}
                                width="300" height="300" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                            </motion.svg>
                        </motion.div>

                        {/* Smaller Lighter Sparkle - Center Left */}
                        <motion.div
                            style={{ rotate: useTransform(useScroll().scrollY, [0, 1000], [0, -200]) }}
                            className="absolute top-1/2 -left-10 -translate-y-1/2 text-[#ffc972] opacity-30 blur-md pointer-events-none"
                        >
                            <motion.svg
                                animate={{ rotate: -360 }}
                                transition={{ duration: 78, repeat: Infinity, ease: "linear" }}
                                width="150" height="150" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                            </motion.svg>
                        </motion.div>

                        <h3 className="text-[#fcf0d4] text-xl mb-4 relative z-10 font-light">Estimated Monthly Revenue</h3>
                        <div className="relative z-10 group cursor-default transition-all duration-300 hover:scale-110 hover:saturate-125 w-full flex justify-center px-4">
                            <motion.div
                                key={revenue}
                                initial={{ scale: 0.9, opacity: 0.5 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-5xl md:text-7xl font-bold tracking-tighter bg-[linear-gradient(110deg,#ff982b_0%,#ffc972_45%,#ffffff_50%,#ff982b_55%,#ffc972_100%)] bg-[length:300%_100%] bg-right group-hover:bg-left bg-clip-text text-transparent transition-[background-position] duration-0 group-hover:duration-700 ease-in-out py-2 px-1"
                            >
                                {formatCurrency(revenue)}
                            </motion.div>
                        </div>

                        <div className="mt-12 grid grid-cols-2 gap-4 w-full relative z-10">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <p className="text-[#a1a1aa] text-sm mb-1">Booked Calls</p>
                                <p className="text-2xl font-bold text-white">
                                    {formatNumber(Math.floor(monthlyViews * (bookedCallsPer100k / 100000)))}
                                </p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <p className="text-[#a1a1aa] text-sm mb-1">Deals Closed</p>
                                <p className="text-2xl font-bold text-white">
                                    {formatNumber(Math.floor((monthlyViews * (bookedCallsPer100k / 100000)) * (closeRate / 100)))}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default RevenueCalculator;
