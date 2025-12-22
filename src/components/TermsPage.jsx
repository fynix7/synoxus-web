import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff982b]/5 rounded-full blur-[150px]" />
            </div>

            <div className="relative max-w-3xl mx-auto px-6 py-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <a href="/" className="inline-flex items-center gap-2 text-[#71717a] hover:text-[#ff982b] transition-colors mb-8">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </a>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff982b] to-[#ffc972] flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-black" />
                        </div>
                        <h1 className="text-4xl font-bold">Terms of Service</h1>
                    </div>
                    <p className="text-[#71717a]">Last updated: December 21, 2024</p>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="prose prose-invert prose-orange max-w-none space-y-8"
                >
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                        <p className="text-[#a1a1aa] leading-relaxed">
                            By accessing and using Synoxus ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                        <p className="text-[#a1a1aa] leading-relaxed">
                            Synoxus provides YouTube content creation tools including thumbnail generation, title optimization, video research, and content planning services. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
                        <p className="text-[#a1a1aa] leading-relaxed mb-4">
                            To use certain features, you must create an account. You agree to:
                        </p>
                        <ul className="list-disc list-inside text-[#a1a1aa] space-y-2">
                            <li>Provide accurate and complete information</li>
                            <li>Maintain the security of your password</li>
                            <li>Accept responsibility for all activities under your account</li>
                            <li>Notify us immediately of any unauthorized access</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use</h2>
                        <p className="text-[#a1a1aa] leading-relaxed mb-4">
                            You agree not to:
                        </p>
                        <ul className="list-disc list-inside text-[#a1a1aa] space-y-2">
                            <li>Use the Service for any unlawful purpose</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Interfere with or disrupt the Service</li>
                            <li>Upload malicious code or content</li>
                            <li>Violate any applicable laws or regulations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Intellectual Property</h2>
                        <p className="text-[#a1a1aa] leading-relaxed">
                            Content you create using our tools remains your property. However, you grant us a license to use anonymized data to improve our services. The Synoxus platform, including its design, code, and branding, remains our intellectual property.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Third-Party Services</h2>
                        <p className="text-[#a1a1aa] leading-relaxed">
                            Our Service integrates with third-party services including YouTube, AI providers, and cloud storage. Your use of these integrations is subject to their respective terms of service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
                        <p className="text-[#a1a1aa] leading-relaxed">
                            The Service is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Termination</h2>
                        <p className="text-[#a1a1aa] leading-relaxed">
                            We may terminate or suspend your account at our discretion, with or without notice, for conduct that we believe violates these Terms or is harmful to other users or our business.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">9. Changes to Terms</h2>
                        <p className="text-[#a1a1aa] leading-relaxed">
                            We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the new Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">10. Contact</h2>
                        <p className="text-[#a1a1aa] leading-relaxed">
                            For questions about these Terms, contact us at: <a href="mailto:iyohanthomas7@gmail.com" className="text-[#ff982b] hover:text-[#ffc972]">iyohanthomas7@gmail.com</a>
                        </p>
                    </section>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsOfService;
