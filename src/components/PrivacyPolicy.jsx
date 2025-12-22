import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#ffc972]/5 rounded-full blur-[150px]" />
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
                        <h1 className="text-4xl font-bold">Privacy Policy</h1>
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
                        <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
                        <p className="text-[#a1a1aa] leading-relaxed mb-4">
                            We collect information you provide directly:
                        </p>
                        <ul className="list-disc list-inside text-[#a1a1aa] space-y-2">
                            <li><strong className="text-white">Account Information:</strong> Email address, display name, and password</li>
                            <li><strong className="text-white">Content:</strong> Thumbnails, templates, characters, and landing pages you create</li>
                            <li><strong className="text-white">Usage Data:</strong> How you interact with our tools and features</li>
                            <li><strong className="text-white">Communications:</strong> Messages you send us for support</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
                        <p className="text-[#a1a1aa] leading-relaxed mb-4">
                            We use collected information to:
                        </p>
                        <ul className="list-disc list-inside text-[#a1a1aa] space-y-2">
                            <li>Provide and improve our services</li>
                            <li>Process your requests and transactions</li>
                            <li>Send you updates, tips, and promotional content (with your consent)</li>
                            <li>Respond to your inquiries and support requests</li>
                            <li>Analyze usage patterns to enhance user experience</li>
                            <li>Ensure security and prevent fraud</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Data Storage & Security</h2>
                        <p className="text-[#a1a1aa] leading-relaxed">
                            Your data is stored securely using Supabase, a trusted cloud platform with enterprise-grade security. We implement industry-standard encryption and security measures to protect your information. However, no method of transmission over the Internet is 100% secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Data Sharing</h2>
                        <p className="text-[#a1a1aa] leading-relaxed mb-4">
                            We do not sell your personal information. We may share data with:
                        </p>
                        <ul className="list-disc list-inside text-[#a1a1aa] space-y-2">
                            <li><strong className="text-white">Service Providers:</strong> Third parties that help us operate (hosting, AI services)</li>
                            <li><strong className="text-white">Legal Requirements:</strong> When required by law or to protect our rights</li>
                            <li><strong className="text-white">Business Transfers:</strong> In connection with a merger or acquisition</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Third-Party Services</h2>
                        <p className="text-[#a1a1aa] leading-relaxed">
                            We integrate with third-party services including YouTube API, Google AI (Gemini), and image generation APIs. These services have their own privacy policies. We encourage you to review the privacy practices of services you connect to through our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Cookies & Tracking</h2>
                        <p className="text-[#a1a1aa] leading-relaxed">
                            We use essential cookies to maintain your session and preferences. We may use analytics to understand how users interact with our Service. You can control cookie preferences through your browser settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights</h2>
                        <p className="text-[#a1a1aa] leading-relaxed mb-4">
                            You have the right to:
                        </p>
                        <ul className="list-disc list-inside text-[#a1a1aa] space-y-2">
                            <li>Access your personal data</li>
                            <li>Correct inaccurate information</li>
                            <li>Delete your account and associated data</li>
                            <li>Opt out of marketing communications</li>
                            <li>Export your data in a portable format</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Data Retention</h2>
                        <p className="text-[#a1a1aa] leading-relaxed">
                            We retain your data as long as your account is active or as needed to provide services. Upon account deletion, we will delete or anonymize your data within 30 days, except where retention is required by law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
                        <p className="text-[#a1a1aa] leading-relaxed">
                            Our Service is not intended for children under 13. We do not knowingly collect personal information from children. If we learn we have collected such information, we will delete it promptly.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">10. Changes to Policy</h2>
                        <p className="text-[#a1a1aa] leading-relaxed">
                            We may update this Privacy Policy periodically. We will notify you of significant changes via email or through the Service. Continued use after changes constitutes acceptance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
                        <p className="text-[#a1a1aa] leading-relaxed">
                            For privacy-related questions or to exercise your rights, contact us at: <a href="mailto:iyohanthomas7@gmail.com" className="text-[#ff982b] hover:text-[#ffc972]">iyohanthomas7@gmail.com</a>
                        </p>
                    </section>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
