import Link from "next/link";

export const metadata = {
    title: "Terms of Service — Meraki",
    description: "Terms of Service for Meraki creative hobby platform",
};

export default function TermsPage() {
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
                <h1 className="!text-4xl md:!text-5xl mb-4">Terms of Service</h1>
                <p className="text-gray-500 mb-8">
                    Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>

                <div className="prose prose-gray max-w-none">
                    {/* Section 1 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Welcome to Meraki! By accessing or using our platform, you agree to be bound by these Terms of Service
                            and our Privacy Policy. If you don't agree with any part of these terms, please don't use our service.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            Meraki is a creative hobby discovery and tracking platform designed to help you explore, practice, and
                            grow in creative pursuits. We're here to guide, encourage, and celebrate your creative journey.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">2. User Accounts</h2>
                        <h3 className="!text-lg !font-semibold mb-3">2.1 Registration</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            To access certain features, you'll need to create an account. You agree to:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>Provide accurate, current, and complete information</li>
                            <li>Maintain and update your information to keep it accurate</li>
                            <li>Keep your password secure and confidential</li>
                            <li>Notify us immediately of any unauthorized access to your account</li>
                        </ul>

                        <h3 className="!text-lg !font-semibold mb-3">2.2 Age Requirement</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            You must be at least 13 years old to use Meraki. If you're under 18, you should have your parent or
                            guardian's permission to use our service.
                        </p>

                        <h3 className="!text-lg !font-semibold mb-3">2.3 Account Responsibility</h3>
                        <p className="text-gray-600 leading-relaxed">
                            You're responsible for all activity that occurs under your account. We're not liable for any loss or
                            damage arising from your failure to maintain account security.
                        </p>
                    </section>

                    {/* Section 3 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">3. User Content</h2>
                        <h3 className="!text-lg !font-semibold mb-3">3.1 Your Content</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            You retain all rights to the content you create on Meraki, including:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>Practice session notes and reflections</li>
                            <li>Images you upload of your creative work</li>
                            <li>Quiz responses and preferences</li>
                            <li>Profile information and bio</li>
                        </ul>

                        <h3 className="!text-lg !font-semibold mb-3">3.2 License to Us</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            By uploading content to Meraki, you grant us a limited license to store, display, and process your
                            content solely for the purpose of providing and improving our service. We will never sell your content or
                            use it for advertising purposes.
                        </p>

                        <h3 className="!text-lg !font-semibold mb-3">3.3 Content Standards</h3>
                        <p className="text-gray-600 leading-relaxed">
                            You agree not to upload content that is illegal, offensive, harassing, or infringes on others' rights.
                            We reserve the right to remove content that violates these standards.
                        </p>
                    </section>

                    {/* Section 4 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">4. Our Content & Intellectual Property</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            All content provided by Meraki, including but not limited to:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>Hobby guides and project instructions</li>
                            <li>7-day learning paths</li>
                            <li>Challenge descriptions and tips</li>
                            <li>Quiz questions and matching algorithms</li>
                            <li>Website design, logos, and branding</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed">
                            ...is owned by Meraki and protected by copyright, trademark, and other intellectual property laws. You
                            may use this content for personal, non-commercial purposes only.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">5. AI-Generated Content</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Meraki uses artificial intelligence to provide personalized feedback, hobby recommendations, and
                            insights. Please note:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>AI-generated feedback is for guidance and encouragement only</li>
                            <li>It should not be considered professional advice</li>
                            <li>Results may vary and are not guaranteed to be accurate</li>
                            <li>We continuously work to improve our AI systems</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed">
                            Your practice session data and quiz responses are used to generate personalized recommendations, but we
                            never share your individual data with third parties.
                        </p>
                    </section>

                    {/* Section 6 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">6. Acceptable Use</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">You agree NOT to:</p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Use Meraki for any illegal purpose</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Interfere with or disrupt the service</li>
                            <li>Scrape, copy, or download content using automated means</li>
                            <li>Impersonate others or create fake accounts</li>
                            <li>Harass, abuse, or harm other users</li>
                            <li>Upload viruses, malware, or malicious code</li>
                        </ul>
                    </section>

                    {/* Section 7 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">7. Termination</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            You can delete your account at any time through your Settings page. Upon deletion:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>Your profile and personal data will be permanently deleted</li>
                            <li>Your practice sessions and progress data will be removed</li>
                            <li>This action cannot be undone</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed">
                            We reserve the right to suspend or terminate accounts that violate these Terms of Service.
                        </p>
                    </section>

                    {/* Section 8 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">8. Disclaimers</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Meraki is provided "as is" without warranties of any kind. We don't guarantee that:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                            <li>The service will be uninterrupted or error-free</li>
                            <li>You will achieve specific creative outcomes</li>
                            <li>All content will be accurate or up-to-date</li>
                            <li>The service will meet all your requirements</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed">
                            Your use of Meraki is at your own risk. We're here to support your creative journey, but ultimately,
                            your progress depends on your own effort and practice.
                        </p>
                    </section>

                    {/* Section 9 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">9. Limitation of Liability</h2>
                        <p className="text-gray-600 leading-relaxed">
                            To the maximum extent permitted by law, Meraki and its creators shall not be liable for any indirect,
                            incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether
                            incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting
                            from your use of the service.
                        </p>
                    </section>

                    {/* Section 10 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">10. Changes to Terms</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We may update these Terms of Service from time to time. We'll notify you of significant changes by
                            posting a notice on our website or sending you an email. Your continued use of Meraki after changes are
                            posted constitutes acceptance of the updated terms.
                        </p>
                    </section>

                    {/* Section 11 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">11. Governing Law</h2>
                        <p className="text-gray-600 leading-relaxed">
                            These Terms shall be governed by and construed in accordance with the laws of your jurisdiction, without
                            regard to its conflict of law provisions.
                        </p>
                    </section>

                    {/* Section 12 */}
                    <section className="mb-10">
                        <h2 className="!text-2xl !font-bold mb-4">12. Contact Us</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            If you have questions about these Terms of Service, please contact us at:
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            <strong>Email:</strong> legal@meraki.app
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
                            Remember: It doesn't have to be perfect — it just has to be yours. We're here to support your creative
                            journey, not to create legal barriers. These terms exist to protect both you and us so we can focus on
                            what matters: making art you'll fall in love with making.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
