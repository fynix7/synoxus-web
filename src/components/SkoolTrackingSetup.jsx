import React, { useState } from 'react';

const SkoolTrackingSetup = () => {
    const [formData, setFormData] = useState({
        baseUrl: '',
        utmSource: '',
        utmMedium: '',
        utmCampaign: '',
        utmContent: ''
    });
    const [checkedSteps, setCheckedSteps] = useState({});

    React.useEffect(() => {
        document.title = 'Skool Tracking Setup - Synoxus';
    }, []);

    const generateUrl = () => {
        let baseInput = formData.baseUrl.trim();
        if (!baseInput) return 'Waiting for input...';

        if (!baseInput.startsWith('http')) {
            baseInput = 'https://' + baseInput;
        }

        try {
            const url = new URL(baseInput);
            const s = formData.utmSource.trim().toLowerCase();
            const m = formData.utmMedium.trim().toLowerCase();
            const c = formData.utmCampaign.trim().toLowerCase();
            const ct = formData.utmContent.trim().toLowerCase();

            if (s) url.searchParams.set('utm_source', s);
            if (m) url.searchParams.set('utm_medium', m);
            if (c) url.searchParams.set('utm_campaign', c);
            if (ct) url.searchParams.set('utm_content', ct);

            return url.toString();
        } catch (e) {
            return 'Invalid Base URL Format';
        }
    };

    const copyUrl = () => {
        const url = generateUrl();
        if (url.startsWith('http')) {
            navigator.clipboard.writeText(url);
            alert('Tracking Link Copied!');
        }
    };

    const clearFields = () => {
        setFormData({
            baseUrl: '',
            utmSource: '',
            utmMedium: '',
            utmCampaign: '',
            utmContent: ''
        });
    };

    const toggleStep = (step) => {
        setCheckedSteps(prev => ({ ...prev, [step]: !prev[step] }));
    };

    const MicroStep = ({ children }) => (
        <div className="mt-3 pl-5 relative text-[#e5e5e5] text-[15px]">
            <span className="absolute left-0 text-[#ff982b] font-bold">•</span>
            {children}
        </div>
    );

    const Kbd = ({ children }) => (
        <span className="inline-block px-2 py-0.5 border border-white/20 border-b-2 rounded-lg bg-white/5 font-mono text-xs text-white">
            {children}
        </span>
    );

    const Code = ({ children }) => (
        <code className="bg-white/10 px-1.5 py-0.5 rounded text-[#ff6b6b] font-mono text-sm">
            {children}
        </code>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10 overflow-y-auto">
            <div className="max-w-4xl mx-auto bg-[#121212] border border-white/10 rounded-3xl p-8 md:p-16 shadow-2xl">
                {/* Header */}
                <h1 className="text-4xl md:text-5xl font-bold mb-4 py-2 leading-tight bg-gradient-to-r from-[#ff982b] to-[#ffc972] bg-clip-text text-transparent">
                    Tracking Skool Conversions
                </h1>

                <div className="text-lg text-[#a1a1aa] mb-8 pb-6 border-b border-white/10 leading-relaxed">
                    I know we previously explored using click-based tracking but it misses the most important aspect: conversions.
                    With what I'm going to outline we can actually track what really matters.
                    Skool has a very limited built-in tracking system but I found a work-around that doesn't require affiliate links.
                    This will allow us to track <strong className="text-white">conversion per video</strong> and get much more valuable metrics.
                </div>

                {/* Section: Why This Works */}
                <div className="inline-block bg-[#ff982b]/10 text-[#ff982b] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 mt-8">
                    Why This Works
                </div>
                <h2 className="text-2xl font-semibold mb-4">What this system measures, and why it is reliable</h2>

                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 mb-4">
                    <ul className="space-y-3 text-[#e5e5e5]">
                        <li><strong className="text-white">Tracks conversions, not clicks:</strong> we count a new member only after they successfully join and load the paid welcome post.</li>
                        <li><strong className="text-white">Video-level attribution:</strong> UTMs on your links let GA4 tie conversions back to <Code>utm_content</Code> (your video ID).</li>
                        <li><strong className="text-white">Low friction and compliant:</strong> Avoids affiliate link dependence & needing multiple fake "invited by" accounts which are against Skool TOS.</li>
                        <li><strong className="text-white">Attribution protection:</strong> Stripe and Skool are blocked from misattributing source credit to themselves as middlemen.</li>
                        <li><strong className="text-white">Cleaner "new member" reporting:</strong> Staff and existing members can be excluded via audiences.</li>
                    </ul>

                    <div className="bg-[#0a3d62]/30 border border-[#3498db]/30 rounded-xl p-4 mt-4 text-[#7ec8e3]">
                        <strong>TLDR:</strong><br />
                        1) Skool sends page_view events into GA4.<br />
                        2) When the paid welcome post is loaded, we create a conversion event.<br />
                        3) UTMs on the entry link tell GA4 which video the session came from.
                    </div>
                </div>

                {/* Section: Standards */}
                <div className="inline-block bg-[#ff982b]/10 text-[#ff982b] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 mt-8">
                    Standards
                </div>
                <h2 className="text-2xl font-semibold mb-4">UTM structure</h2>

                <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-4 px-4 text-[#a1a1aa] font-semibold">Source (utm_source)</th>
                                <th className="text-left py-4 px-4 text-[#a1a1aa] font-semibold">Medium (utm_medium)</th>
                                <th className="text-left py-4 px-4 text-[#a1a1aa] font-semibold">Campaign (utm_campaign)</th>
                                <th className="text-left py-4 px-4 text-[#a1a1aa] font-semibold">Content (utm_content)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-white/5">
                                <td className="py-4 px-4">youtube</td>
                                <td className="py-4 px-4">vid</td>
                                <td className="py-4 px-4">course, top, mid, bot</td>
                                <td className="py-4 px-4">Video Name/Date (ex: 12162025)</td>
                            </tr>
                            <tr className="border-b border-white/5">
                                <td className="py-4 px-4">instagram</td>
                                <td className="py-4 px-4">msg, story</td>
                                <td className="py-4 px-4">freebie, nurture</td>
                                <td className="py-4 px-4">pitch, followup</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="text-sm text-[#71717a]">
                    Rule: always lowercase. This prevents "Youtube" and "youtube" from splitting into two sources.
                </p>

                {/* Section: Link Builder */}
                <div className="inline-block bg-[#ff982b]/10 text-[#ff982b] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 mt-8">
                    Internal Tool
                </div>
                <h2 className="text-2xl font-semibold mb-4">Tracking Link Builder</h2>

                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-[#71717a] uppercase tracking-wider mb-2 font-semibold">Base Skool URL</label>
                            <input
                                type="text"
                                value={formData.baseUrl}
                                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                                placeholder="https://www.skool.com/makerschool"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-full px-5 py-3 text-white focus:outline-none focus:border-[#ff982b] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[#71717a] uppercase tracking-wider mb-2 font-semibold">Source (utm_source)</label>
                            <input
                                type="text"
                                value={formData.utmSource}
                                onChange={(e) => setFormData({ ...formData, utmSource: e.target.value })}
                                placeholder="youtube"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-full px-5 py-3 text-white focus:outline-none focus:border-[#ff982b] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[#71717a] uppercase tracking-wider mb-2 font-semibold">Medium (utm_medium)</label>
                            <input
                                type="text"
                                value={formData.utmMedium}
                                onChange={(e) => setFormData({ ...formData, utmMedium: e.target.value })}
                                placeholder="vid"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-full px-5 py-3 text-white focus:outline-none focus:border-[#ff982b] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[#71717a] uppercase tracking-wider mb-2 font-semibold">Campaign (utm_campaign)</label>
                            <input
                                type="text"
                                value={formData.utmCampaign}
                                onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                                placeholder="top"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-full px-5 py-3 text-white focus:outline-none focus:border-[#ff982b] transition-colors"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs text-[#71717a] uppercase tracking-wider mb-2 font-semibold">Content (Video Name / Date)</label>
                            <input
                                type="text"
                                value={formData.utmContent}
                                onChange={(e) => setFormData({ ...formData, utmContent: e.target.value })}
                                placeholder="12162025"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-full px-5 py-3 text-white focus:outline-none focus:border-[#ff982b] transition-colors"
                            />
                        </div>
                    </div>

                    <div className="bg-black border border-white/10 rounded-xl p-5 mt-4 font-mono text-[#30d158] text-sm break-all min-h-[50px]">
                        {generateUrl()}
                    </div>

                    <div className="flex gap-3 mt-4 flex-wrap">
                        <button
                            onClick={copyUrl}
                            className="bg-[#ff982b] hover:bg-[#e08624] text-black px-6 py-3 rounded-full font-semibold transition-colors"
                        >
                            Copy Final Tracking URL
                        </button>
                        <button
                            onClick={clearFields}
                            className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-5 py-3 rounded-full font-semibold transition-colors"
                        >
                            Clear All Fields
                        </button>
                    </div>

                    <p className="text-xs text-[#71717a] mt-3">
                        Case sensitivity warning: UTMs are case sensitive. This tool forces lowercase automatically.
                    </p>
                </div>

                {/* Section: Execution */}
                <div className="inline-block bg-[#ff982b]/10 text-[#ff982b] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 mt-8">
                    Execution
                </div>
                <h2 className="text-2xl font-semibold mb-4">Full Implementation Checklist (microstep-by-step)</h2>

                <div className="bg-[#433500]/30 border border-[#ffcc00]/30 rounded-xl p-4 mb-6 text-[#ffd54f]">
                    <strong>Before you begin:</strong><br />
                    You need Skool admin access, GA4 property editor access, and a way to run one test signup.
                    During testing, disable ad blockers so you do not think the setup is broken.
                </div>

                {/* Step 1 */}
                <div className="flex gap-5 my-8">
                    <button
                        onClick={() => toggleStep(1)}
                        className={`w-7 h-7 flex-shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors ${checkedSteps[1] ? 'bg-[#ff982b] border-[#ff982b]' : 'border-white/20 bg-transparent'}`}
                    >
                        {checkedSteps[1] && <span className="text-white font-bold text-sm">✓</span>}
                    </button>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold underline mb-3">1. Foundation and admin exclusion</h3>
                        <MicroStep><strong>Open GA4 Admin:</strong> go to <Code>analytics.google.com</Code>, make sure you are inside the correct GA4 property (use the property selector if needed), then click the <Kbd>Admin</Kbd> gear in the bottom-left. If you do not see <Kbd>Admin</Kbd>, you may not have GA4 access or you are not inside a property yet.</MicroStep>
                        <MicroStep><strong>Data retention:</strong> <Kbd>Admin</Kbd> → <strong>Data settings</strong> → <strong>Data retention</strong> → set to <strong>14 months</strong>.</MicroStep>
                        <MicroStep><strong>If you do not see it:</strong> use the GA4 Admin search and type <Code>retention</Code>.</MicroStep>
                        <MicroStep><strong>Google Signals:</strong> <Kbd>Admin</Kbd> → <strong>Data settings</strong> → <strong>Data collection</strong> → toggle <strong>Google signals ON</strong>.</MicroStep>
                        <MicroStep><strong>If you do not see it:</strong> use the GA4 Admin search and type <Code>signals</Code>.</MicroStep>
                        <MicroStep><strong>Create Staff audience:</strong> <Kbd>Admin</Kbd> → <strong>Audiences</strong> → <strong>New audience</strong>.</MicroStep>
                        <MicroStep><strong>Staff rule:</strong> include users where <Code>Page path + query string</Code> contains <Code>/admin</Code> OR <Code>/settings</Code> (add other admin paths if needed).</MicroStep>
                        <MicroStep><strong>Name it:</strong> <Code>staff</Code> (lowercase).</MicroStep>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-5 my-8">
                    <button
                        onClick={() => toggleStep(2)}
                        className={`w-7 h-7 flex-shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors ${checkedSteps[2] ? 'bg-[#ff982b] border-[#ff982b]' : 'border-white/20 bg-transparent'}`}
                    >
                        {checkedSteps[2] && <span className="text-white font-bold text-sm">✓</span>}
                    </button>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold underline mb-3">2. Connect GA4 to Skool</h3>
                        <MicroStep><strong>Create property:</strong> <Kbd>Admin</Kbd> → <strong>Create property</strong> (name it for your community).</MicroStep>
                        <MicroStep><strong>Create web stream:</strong> <Kbd>Admin</Kbd> → <strong>Data streams</strong> → <strong>Web</strong> → create a stream.</MicroStep>
                        <MicroStep><strong>Copy Measurement ID:</strong> copy the value that starts with <Code>G-</Code>.</MicroStep>
                        <MicroStep><strong>Paste into Skool:</strong> Skool → Group → <strong>Settings</strong> → <strong>Integrations</strong> → paste into the Google Tag field → save.</MicroStep>
                        <MicroStep><strong>Sanity test:</strong> open your Skool group in a clean browser tab, then GA4 → <strong>Reports</strong> → <strong>Realtime</strong>.</MicroStep>
                        <MicroStep><strong>Expected:</strong> you see your visit as an active user or at least page_view activity within ~60 seconds.</MicroStep>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-5 my-8">
                    <button
                        onClick={() => toggleStep(3)}
                        className={`w-7 h-7 flex-shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors ${checkedSteps[3] ? 'bg-[#ff982b] border-[#ff982b]' : 'border-white/20 bg-transparent'}`}
                    >
                        {checkedSteps[3] && <span className="text-white font-bold text-sm">✓</span>}
                    </button>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold underline mb-3">3. Define the conversion event</h3>

                        <div className="bg-[#433500]/30 border border-[#ffcc00]/30 rounded-xl p-4 my-4 text-[#ffd54f]">
                            <strong>Critical:</strong> this conversion depends on the welcome post URL.
                            If you rename the welcome post, the slug can change and your conversion will stop firing.
                            When in doubt, copy the live welcome post URL and update the rule.
                        </div>

                        <MicroStep><strong>Open your paid welcome post:</strong> in Skool, open the welcome post that new paid members see first.</MicroStep>
                        <MicroStep><strong>Copy the URL path:</strong> copy only the part after <Code>skool.com</Code>. It should start with a slash, example <Code>/makerschool/welcome-heres-what-to-do-first</Code>.</MicroStep>
                        <MicroStep><strong>Create event:</strong> GA4 → <Kbd>Admin</Kbd> → <strong>Events</strong> → <strong>Create event</strong>.</MicroStep>
                        <MicroStep><strong>Name:</strong> <Code>skool_new_member_confirmed</Code>.</MicroStep>
                        <MicroStep><strong>Condition 1:</strong> <Code>event_name</Code> equals <Code>page_view</Code>.</MicroStep>
                        <MicroStep><strong>Condition 2:</strong> <Code>page_location</Code> contains your welcome post path.</MicroStep>
                        <MicroStep><strong>Save.</strong></MicroStep>
                        <MicroStep><strong>Mark as conversion:</strong> GA4 → <Kbd>Admin</Kbd> → <strong>Conversions</strong> → add <Code>skool_new_member_confirmed</Code>.</MicroStep>
                        <MicroStep><strong>Counting:</strong> set to <strong>once per user</strong> if the UI shows the option.</MicroStep>
                        <MicroStep><strong>Expected:</strong> after a test signup, loading the paid welcome post causes <Code>skool_new_member_confirmed</Code> to appear in Realtime or DebugView.</MicroStep>
                    </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-5 my-8">
                    <button
                        onClick={() => toggleStep(4)}
                        className={`w-7 h-7 flex-shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors ${checkedSteps[4] ? 'bg-[#ff982b] border-[#ff982b]' : 'border-white/20 bg-transparent'}`}
                    >
                        {checkedSteps[4] && <span className="text-white font-bold text-sm">✓</span>}
                    </button>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold underline mb-3">4. Existing member exclusion (new member reporting)</h3>
                        <MicroStep><strong>Create audience:</strong> GA4 → <Kbd>Admin</Kbd> → <strong>Audiences</strong> → <strong>New audience</strong>.</MicroStep>
                        <MicroStep><strong>Name:</strong> <Code>existing_member_user</Code>.</MicroStep>
                        <MicroStep><strong>Duration:</strong> set membership duration to <strong>540 days</strong>.</MicroStep>
                        <MicroStep><strong>Rule:</strong> include users where <Code>page_location</Code> contains <Code>/classroom</Code> OR contains your welcome post path.</MicroStep>

                        <div className="bg-[#0a3d62]/30 border border-[#3498db]/30 rounded-xl p-4 mt-4 text-[#7ec8e3]">
                            If your classroom is not fully gated, remove <Code>/classroom</Code> from this rule and rely on the welcome post path only.
                        </div>
                    </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-5 my-8">
                    <button
                        onClick={() => toggleStep(5)}
                        className={`w-7 h-7 flex-shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors ${checkedSteps[5] ? 'bg-[#ff982b] border-[#ff982b]' : 'border-white/20 bg-transparent'}`}
                    >
                        {checkedSteps[5] && <span className="text-white font-bold text-sm">✓</span>}
                    </button>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold underline mb-3">5. Attribution protection (Stripe fix)</h3>
                        <MicroStep><strong>Open stream settings:</strong> GA4 → <Kbd>Admin</Kbd> → <strong>Data streams</strong> → select your web stream.</MicroStep>
                        <MicroStep><strong>Configure:</strong> <strong>Configure tag settings</strong> → <strong>Show all</strong> → <strong>List unwanted referrals</strong>.</MicroStep>
                        <MicroStep><strong>Add:</strong> <Code>stripe.com</Code> and <Code>skool.com</Code>.</MicroStep>
                        <MicroStep><strong>Save.</strong></MicroStep>
                    </div>
                </div>

                {/* Step 6 */}
                <div className="flex gap-5 my-8">
                    <button
                        onClick={() => toggleStep(6)}
                        className={`w-7 h-7 flex-shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors ${checkedSteps[6] ? 'bg-[#ff982b] border-[#ff982b]' : 'border-white/20 bg-transparent'}`}
                    >
                        {checkedSteps[6] && <span className="text-white font-bold text-sm">✓</span>}
                    </button>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold underline mb-3">6. Video level report (Explorations)</h3>
                        <MicroStep><strong>Create exploration:</strong> GA4 → <strong>Explore</strong> → <strong>Blank</strong>.</MicroStep>
                        <MicroStep><strong>Add dimensions:</strong> <Code>Session manual ad content</Code>, <Code>Session campaign</Code>, <Code>Session source / medium</Code>.</MicroStep>
                        <MicroStep><strong>Add metrics:</strong> <Code>Conversions</Code>, <Code>Conversion rate</Code>.</MicroStep>
                        <MicroStep><strong>Filter conversions:</strong> set filter where <Code>Conversion name</Code> equals <Code>skool_new_member_confirmed</Code>.</MicroStep>
                        <MicroStep><strong>Exclude audiences:</strong> exclude <Code>staff</Code> and exclude <Code>existing_member_user</Code> when you want new members only.</MicroStep>

                        <div className="bg-[#433500]/30 border border-[#ffcc00]/30 rounded-xl p-4 mt-4 text-[#ffd54f]">
                            If you do not see "Session manual ad content", search the dimension list for <Code>manual</Code> or <Code>content</Code>.
                            GA4 labels can vary slightly over time.
                        </div>
                    </div>
                </div>

                {/* Quality Control */}
                <div className="inline-block bg-[#ff982b]/10 text-[#ff982b] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 mt-8">
                    Quality Control
                </div>
                <h2 className="text-2xl font-semibold mb-4">Validation steps (do not skip)</h2>

                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
                    <MicroStep><strong>Realtime coverage:</strong> navigate inside Skool, confirm Realtime stays active.</MicroStep>
                    <MicroStep><strong>UTM integrity:</strong> click a builder link, confirm UTMs still exist in the browser bar at destination.</MicroStep>
                    <MicroStep><strong>Conversion proof:</strong> run a test signup and load the paid welcome post, then confirm <Code>skool_new_member_confirmed</Code> appears in events (Realtime or DebugView).</MicroStep>
                    <MicroStep><strong>Referral protection:</strong> confirm conversions are not attributed to <Code>stripe.com</Code> or <Code>skool.com</Code>.</MicroStep>
                </div>

                {/* Troubleshooting */}
                <div className="inline-block bg-[#ff982b]/10 text-[#ff982b] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 mt-8">
                    Troubleshooting
                </div>
                <h2 className="text-2xl font-semibold mb-4">If something is not working</h2>

                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
                    <MicroStep><strong>Realtime shows nothing:</strong> wrong Measurement ID, not saved in Skool, wrong GA4 property, or ad blocker blocking analytics.</MicroStep>
                    <MicroStep><strong>Conversion never fires:</strong> your welcome post URL match is wrong. Copy the live welcome post URL and update Condition 2.</MicroStep>
                    <MicroStep><strong>Conversions show as direct:</strong> UTMs stripped by redirects, link-in-bio tools, or user typed the URL later.</MicroStep>
                    <MicroStep><strong>Sources split:</strong> you used mixed case in UTMs. Builder forces lowercase, so only publish lowercase.</MicroStep>
                </div>

                {/* Disclaimer */}
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 mt-12 text-[#a1a1aa] text-sm leading-relaxed">
                    <strong className="text-white">Clarifications and disclaimers:</strong><br /><br />
                    • Accurate numbers often appear after processing, commonly 24 to 48 hours<br />
                    • Under-reporting happens if buyers use ad blockers, switch devices, or buy then never load the welcome post<br />
                    • This measures confirmed members who load the paid welcome post, not checkout attempts<br />
                    • Existing member exclusion improves over time as GA4 observes more users
                </div>
            </div>
        </div>
    );
};

export default SkoolTrackingSetup;
