import Link from "next/link";

export const metadata = {
    title: "Privacy Policy — Meraki",
    description: "Privacy Policy for Meraki creative hobby platform",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Navigation */}
            <nav className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
                <Link
                    href="/"
                    className="text-2xl font-serif font-bold text-[var(--foreground)] no-underline"
                >
                    Meraki
                </Link>
                <Link
                    href="/"
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors no-underline"
                >
                    Back to Home
                </Link>
            </nav>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
                <h1 className="!text-4xl md:!text-5xl mb-4">Privacy Policy</h1>
                <p className="text-gray-500 mb-8">
                    Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>

                <div className="prose prose-gray max-w-none">
                    {/* Introduction */}
                    <section className="mb-10">
                        <p className="text-gray-600 leading-relaxed mb-4">
                            At Meraki, we believe your creative journey is personal. This Privacy Policy explains how we collect,
                            use, protect, and share your information when you use our platform.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            <strong>Our commitment:</strong> We will never sell your personal data. Your creative work, practice
                            notes, and progress are yours alone. We only use your data to make Meraki better for you.
                        </p>
                    </section>

                    {/* Section 1 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">1. Information We Collect</h2>

                        <h3 className="!text-lg !font-semibold mb-3">1.1 Information You Provide</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">When you use Meraki, you may provide:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>
                                <strong>Account Information:</strong> Email address, full name, password (encrypted)
                            </li>
                            <li>
                                <strong>Profile Information:</strong> Bio, location, pronouns, avatar image
                            </li>
                            <li>
                                <strong>Quiz Responses:</strong> Answers to our 23-question personality quiz about your preferences,
                                lifestyle, and creative interests
                            </li>
                            <li>
                                <strong>Practice Sessions:</strong> Notes, duration, mood ratings, uploaded images of your creative
                                work
                            </li>
                            <li>
                                <strong>Hobby Selections:</strong> Hobbies you're exploring, their status (active, paused, etc.)
                            </li>
                            <li>
                                <strong>Settings:</strong> Notification preferences, privacy settings
                            </li>
                        </ul>

                        <h3 className="!text-lg !font-semibold mb-3">1.2 Automatically Collected Information</h3>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>
                                <strong>Usage Data:</strong> Pages visited, features used, time spent on the platform
                            </li>
                            <li>
                                <strong>Device Information:</strong> Browser type, operating system, IP address
                            </li>
                            <li>
                                <strong>Cookies:</strong> Authentication tokens, session data, preferences
                            </li>
                        </ul>

                        <h3 className="!text-lg !font-semibold mb-3">1.3 Location Data (Optional)</h3>
                        <p className="text-gray-600 leading-relaxed">
                            When you use the "Find Nearby" feature to discover local workshops and classes, we may request your
                            location. This data is used only for that search and is never stored on our servers.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">2. How We Use Your Information</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">We use your information to:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>
                                <strong>Provide the Service:</strong> Create your account, save your progress, display your dashboard
                            </li>
                            <li>
                                <strong>Personalize Your Experience:</strong> Match you with hobbies based on your quiz responses,
                                recommend challenges, generate AI feedback
                            </li>
                            <li>
                                <strong>Track Your Progress:</strong> Calculate streaks, total hours, milestones, and generate your
                                heatmap
                            </li>
                            <li>
                                <strong>Communicate With You:</strong> Send notifications (if enabled), respond to support requests,
                                share important updates
                            </li>
                            <li>
                                <strong>Improve Meraki:</strong> Analyze usage patterns to fix bugs, add features, and enhance the
                                platform
                            </li>
                            <li>
                                <strong>Ensure Security:</strong> Detect and prevent fraud, abuse, and unauthorized access
                            </li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">3. How We Store Your Data</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Your data is stored securely using <strong>Supabase</strong>, a PostgreSQL database platform with
                            enterprise-grade security:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>All data is encrypted in transit (HTTPS/TLS)</li>
                            <li>Passwords are hashed and never stored in plain text</li>
                            <li>Row-level security ensures you can only access your own data</li>
                            <li>Regular backups protect against data loss</li>
                            <li>Servers are hosted in secure, compliant data centers</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed">
                            <strong>Image Storage:</strong> Images you upload are stored in Supabase Storage with access controls
                            ensuring only you can view them.
                        </p>
                    </section>

                    {/* Section 4 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">4. Third-Party Services</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Meraki integrates with the following third-party services:
                        </p>

                        <h3 className="!text-lg !font-semibold mb-3">4.1 Google OAuth</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            If you sign in with Google, we receive your email address and name from Google. We don't access your
                            Gmail, Google Drive, or other Google services. Review{" "}
                            <a
                                href="https://policies.google.com/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--primary)] hover:underline"
                            >
                                Google's Privacy Policy
                            </a>
                            .
                        </p>

                        <h3 className="!text-lg !font-semibold mb-3">4.2 Google Maps API</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            The "Find Nearby" feature uses Google Maps to search for local workshops and classes. Your location is
                            sent to Google for this search but is not stored by Meraki. Review{" "}
                            <a
                                href="https://policies.google.com/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--primary)] hover:underline"
                            >
                                Google Maps Privacy Policy
                            </a>
                            .
                        </p>

                        <h3 className="!text-lg !font-semibold mb-3">4.3 AI Services (Future)</h3>
                        <p className="text-gray-600 leading-relaxed">
                            We plan to use AI services (such as OpenAI or similar) to generate personalized feedback and hobby
                            recommendations. Your practice session notes may be sent to these services, but we will never include
                            personally identifiable information in AI requests.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">5. Data Sharing & Disclosure</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            <strong>We do not sell your personal data. Period.</strong>
                        </p>
                        <p className="text-gray-600 leading-relaxed mb-4">We may share your information only in these cases:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>
                                <strong>With Your Consent:</strong> If you explicitly agree to share data (e.g., making your profile
                                public in the future)
                            </li>
                            <li>
                                <strong>Service Providers:</strong> Third parties that help us operate Meraki (hosting, analytics, AI)
                                under strict confidentiality agreements
                            </li>
                            <li>
                                <strong>Legal Obligations:</strong> If required by law, court order, or to protect rights and safety
                            </li>
                            <li>
                                <strong>Business Transfers:</strong> In the event of a merger or acquisition, with notice to you
                            </li>
                        </ul>
                    </section>

                    {/* Section 6 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">6. Your Privacy Rights</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">You have the right to:</p>

                        <h3 className="!text-lg !font-semibold mb-3">6.1 Access Your Data</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            View all your data through your Profile and Settings pages. You can also export your complete data as a
                            JSON file from Settings → Export My Data.
                        </p>

                        <h3 className="!text-lg !font-semibold mb-3">6.2 Correct Your Data</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Update your profile information, bio, and settings at any time through your Profile page.
                        </p>

                        <h3 className="!text-lg !font-semibold mb-3">6.3 Delete Your Data</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Delete your account and all associated data from Settings → Delete Account. This action is permanent and
                            cannot be undone. We will delete:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>Your profile and account information</li>
                            <li>All practice sessions and notes</li>
                            <li>Quiz responses and hobby matches</li>
                            <li>Uploaded images</li>
                            <li>Progress data, streaks, and milestones</li>
                        </ul>

                        <h3 className="!text-lg !font-semibold mb-3">6.4 Opt-Out of Communications</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Control your notification preferences in Settings. You can disable email notifications, streak reminders,
                            challenge alerts, and weekly digests.
                        </p>

                        <h3 className="!text-lg !font-semibold mb-3">6.5 GDPR Rights (EU Users)</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            If you're in the European Union, you have additional rights under GDPR:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Right to data portability (export your data)</li>
                            <li>Right to restrict processing</li>
                            <li>Right to object to processing</li>
                            <li>Right to lodge a complaint with a supervisory authority</li>
                        </ul>

                        <h3 className="!text-lg !font-semibold mb-3 mt-4">6.6 CCPA Rights (California Users)</h3>
                        <p className="text-gray-600 leading-relaxed">
                            California residents have the right to know what personal information we collect, request deletion, and
                            opt-out of data sales (which we don't do anyway).
                        </p>
                    </section>

                    {/* Section 7 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">7. Cookies & Tracking</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">We use cookies for:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>
                                <strong>Authentication:</strong> Keep you logged in securely
                            </li>
                            <li>
                                <strong>Preferences:</strong> Remember your settings and choices
                            </li>
                            <li>
                                <strong>Analytics:</strong> Understand how people use Meraki (anonymized)
                            </li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed">
                            You can disable cookies in your browser settings, but this may affect your ability to use Meraki.
                        </p>
                    </section>

                    {/* Section 8 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">8. Children's Privacy</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Meraki is not intended for children under 13. We do not knowingly collect personal information from
                            children under 13. If you're a parent and believe your child has provided us with personal information,
                            please contact us at privacy@meraki.app and we will delete it immediately.
                        </p>
                    </section>

                    {/* Section 9 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">9. Data Retention</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We retain your data for as long as your account is active. When you delete your account, we permanently
                            delete your data within 30 days. Some anonymized, aggregated data may be retained for analytics purposes
                            (e.g., "100 users completed the pottery challenge" — with no personal identifiers).
                        </p>
                    </section>

                    {/* Section 10 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">10. International Users</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Meraki is operated globally. If you're accessing Meraki from outside the country where our servers are
                            located, your data may be transferred across borders. We ensure appropriate safeguards are in place to
                            protect your data regardless of where it's processed.
                        </p>
                    </section>

                    {/* Section 11 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">11. Security</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We take security seriously and implement industry-standard measures:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>Encryption in transit (HTTPS) and at rest</li>
                            <li>Secure password hashing (bcrypt)</li>
                            <li>Regular security audits and updates</li>
                            <li>Access controls and authentication</li>
                            <li>Monitoring for suspicious activity</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed">
                            However, no system is 100% secure. If you discover a security vulnerability, please report it to
                            security@meraki.app.
                        </p>
                    </section>

                    {/* Section 12 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">12. Changes to This Policy</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We may update this Privacy Policy from time to time. We'll notify you of significant changes by posting a
                            notice on our website or sending you an email. The "Last updated" date at the top will always reflect the
                            most recent version.
                        </p>
                    </section>

                    {/* Section 13 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">13. Contact Us</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            If you have questions, concerns, or requests regarding your privacy, please contact us:
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            <strong>Email:</strong> privacy@meraki.app
                            <br />
                            <strong>Data Protection:</strong> dpo@meraki.app
                            <br />
                            <strong>Website:</strong>{" "}
                            <Link href="/" className="text-[var(--primary)] hover:underline">
                                meraki.app
                            </Link>
                        </p>
                    </section>

                    {/* Footer */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <p className="text-sm text-gray-500 italic">
                            Your creative journey is personal, and we respect that. We're committed to protecting your privacy while
                            helping you discover and develop creative hobbies you'll love. If you ever have concerns, we're here to
                            listen.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
