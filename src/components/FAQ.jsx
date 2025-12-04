import React from 'react';
import { motion } from 'framer-motion';

const faqs = [
    { question: "What is your turnaround time?", answer: "Usually 24-48 hours depending on the complexity of the project." },
    { question: "Do you offer revisions?", answer: "Yes, I offer unlimited revisions until you are 100% satisfied." },
    { question: "How do we communicate?", answer: "We can communicate via Slack, Discord, or Email." },
];

const FAQ = () => {
    return (
        <section id="faqs" className="py-20 w-full max-w-4xl px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-light mb-4 bg-gradient-to-b from-[#ff982b] to-[#ffc972] bg-clip-text text-transparent">FAQs</h2>
            </div>

            <div className="space-y-4">
                {faqs.map((faq, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-surface border border-white/5 rounded-xl p-6 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                        <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                        <p className="text-gray-400">{faq.answer}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default FAQ;
