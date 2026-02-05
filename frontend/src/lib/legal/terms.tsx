import Link from "next/link";
import { CONTACT_EMAIL, OPERATOR_COUNTRY, REPO_URL } from "./contact";
import type { LegalDoc } from "./types";

/**
 * Terms for a free service run by one person, not a template borrowed from a
 * funded company. Notably absent, on purpose:
 *  - payment, refund and tax clauses — Meraki charges nothing and has no
 *    payment processor. Including them would describe a service that
 *    doesn't exist.
 *  - arbitration and class-action waivers — US-specific devices that don't
 *    map onto Tunisian civil procedure.
 *
 * Present because the code requires it: the YouTube API Services disclosure,
 * a fair-use clause (the operator personally pays for every API call), and a
 * discontinuation clause (this is a personal project that may not run forever).
 *
 * On open source: these terms govern the HOSTED SERVICE only. The code licence
 * lives in the repository and is referenced, never restated — two documents
 * stating licence terms is two documents that can contradict each other, and
 * the one in the repo is the one a court would read.
 *
 * Section ids are public URLs. Don't rename them casually.
 *
 * The intro says "the operator" rather than naming a person. The party is
 * still identified — the Privacy Policy's "Who We Are" names the controller,
 * and these terms incorporate that document by reference in the paragraph
 * immediately below. If the Privacy Policy ever stops naming them, this stops
 * identifying a counterparty and the agreement weakens.
 */
export const TERMS: LegalDoc = {
  slug: "terms",
  title: "Terms of Service",
  shortTitle: "Terms",
  updated: "2026-02-05",

  intro: (
    <>
      <p>
        Meraki helps you discover, practice, and grow in creative hobbies —
        we&apos;re here to <em>guide</em> and celebrate that journey, not to bury
        you in fine print.
      </p>
      <p>
        These are the rules of the road. They are a binding agreement between
        you and the operator. By creating an account or using Meraki you accept
        them. If you don&apos;t agree with them, please don&apos;t use the
        service.
      </p>
      <p>
        They should be read alongside our{" "}
        <Link href="/privacy">Privacy Policy</Link>, which forms part of this
        agreement.
      </p>
    </>
  ),

  sections: [
    {
      id: "what-meraki-is",
      title: "What Meraki Is",
      body: (
        <>
          <p>
            Meraki is a web application that helps you find a creative hobby,
            try it in small ways, and keep a record of your practice. It uses
            automated systems to suggest hobbies, generate challenges, and write
            feedback on the sessions you log.
          </p>
          <p>
            Meraki is provided <strong>free of charge</strong>. There is no
            subscription, no payment, and nothing to cancel. If that ever
            changes, we will tell you before it does and you will not be charged
            for anything without agreeing to it first.
          </p>
        </>
      ),
    },
    {
      id: "eligibility",
      title: "Who Can Use It",
      body: (
        <>
          <p>
            You must be at least <strong>13 years old</strong> to create an
            account. If you are under 18, you should have a parent or
            guardian&apos;s permission before using Meraki.
          </p>
          <p>
            By using Meraki you confirm that you can enter into this agreement,
            that the information you give us is accurate, and that you are not
            barred from using the service under any applicable law or by a
            previous suspension.
          </p>
        </>
      ),
    },
    {
      id: "your-account",
      title: "Your Account",
      body: (
        <>
          <p>
            Keep your login details private, and don&apos;t let anyone else use
            your account. You are responsible for what happens under your
            account. Tell us promptly at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if you think
            someone has gained access to it.
          </p>
          <p>
            You can delete your account at any time from Settings. Deletion is
            immediate and permanent — see the{" "}
            <Link href="/privacy">Privacy Policy</Link> for exactly what is
            removed.
          </p>
        </>
      ),
    },
    {
      id: "your-content",
      title: "Your Content",
      body: (
        <>
          <p>
            <strong>You own what you create.</strong> Your practice notes,
            photos, quiz answers, and profile remain yours. We claim no ownership
            of them.
          </p>
          <p>
            To run the service, you give us a limited, non-exclusive,
            royalty-free licence to store, copy, process, and display your
            content back to you. This licence exists only so the app can
            function — it goes no further, and it ends when you delete the
            content or your account. We do not publish your content, sell it,
            use it for advertising, or license it onward.
          </p>
          <p>
            Don&apos;t upload anything unlawful, harassing, hateful, or that
            infringes someone else&apos;s rights, and don&apos;t upload other
            people&apos;s personal information without their permission. We may
            remove content that breaks this rule.
          </p>
          <p>
            <strong>Suggestions are different.</strong> If you send us ideas for
            improving Meraki, we may use them freely and without owing you
            anything — that way we never have to refuse to read one. This
            applies only to feedback about the product, never to the content you
            create in the app.
          </p>
        </>
      ),
    },
    {
      id: "ai-content",
      title: "AI-Generated Content",
      body: (
        <>
          <p>
            Hobby matches, challenges, and practice feedback are produced by AI
            agents, using the answers and notes you provide. See the{" "}
            <Link href="/privacy">Privacy Policy</Link> for what gets sent where.
          </p>
          <p>
            <strong>
              Treat this output as encouragement, not expertise.
            </strong>{" "}
            It can be wrong, inconsistent, or generic. It is not professional,
            medical, psychological, financial, or safety advice, and it is not a
            substitute for proper instruction — particularly for hobbies
            involving tools, heat, chemicals, heights, or anything else that can
            hurt you. Use your own judgement, and get qualified guidance where
            it matters.
          </p>
          <p>
            Some hobbies carry real physical risk. You take part in them at your
            own risk and are responsible for your own safety and for following
            the law where you live.
          </p>
        </>
      ),
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use",
      body: (
        <>
          <p>You agree not to:</p>
          <ul>
            <li>Use Meraki for anything unlawful, or to help anyone else do so</li>
            <li>Attempt to gain unauthorised access to the service, its systems, or another person&apos;s account</li>
            <li>Interfere with, disrupt, or place an unreasonable load on the service</li>
            <li>Scrape, crawl, or harvest content or data from the hosted service by automated means</li>
            <li>Circumvent authentication, rate limits, or any other access control</li>
            <li>Probe or attack the infrastructure the service runs on</li>
            <li>Use Meraki, or the AI features within it, to generate or distribute unlawful, hateful, harassing, or deliberately misleading material</li>
            <li>Use the hosted service as a pipeline to train, fine-tune, or benchmark another AI system</li>
            <li>Impersonate anyone, or create accounts in someone else&apos;s name</li>
            <li>Harass, abuse, or harm other people</li>
            <li>Upload malicious code</li>
            <li>Resell or commercialise access to the hosted service without our written permission</li>
          </ul>
        </>
      ),
    },
    {
      id: "our-content",
      title: "Our Content",
      body: (
        <>
          <p>
            The hobby guides, challenges, learning roadmaps, and quiz questions
            are ours and are protected by copyright. You may use them for your
            own personal, non-commercial purposes while using Meraki. Using the
            service does not grant you any licence beyond that.
          </p>
          <p>
            <strong>The Meraki name, logo, and visual identity are not
            licensed to anyone.</strong> This holds even where the source code
            is openly licensed — a code licence covers code, never a brand. You
            may not use them to name, brand, or promote your own project or
            service, or in any way suggesting we endorse or are connected with
            it. You may of course say truthfully that your work is based on
            Meraki.
          </p>
          <p>
            If instead you believe something on Meraki infringes{" "}
            <strong>your</strong> copyright, email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with enough
            detail to identify the work and where it appears, and we will
            review it promptly and remove anything infringing. We may disable
            accounts that repeatedly infringe others&apos; rights.
          </p>
        </>
      ),
    },
    {
      id: "open-source",
      title: "Open Source",
      body: (
        <>
          <p>
            Meraki&apos;s source code is published at{" "}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              {REPO_URL.replace(/^https:\/\//, "")}
            </a>{" "}
            under the <strong>GNU Affero General Public License v3.0</strong>.
            You are free to use, study, modify and share it, including
            commercially — and if you run a modified version as a network
            service, you must make your source available in turn. The{" "}
            <code>LICENSE</code> file in that repository is what governs; these
            terms do not restate it.
          </p>
          <p>
            Keep the two apart. <strong>These terms cover the hosted service</strong>{" "}
            we run at this website, and the account and data you have with us.{" "}
            <strong>The repository licence covers the code</strong> and what you
            may do if you copy, modify, or run it yourself. Nothing here
            restricts rights the licence grants you, and nothing in the licence
            gives you rights over the hosted service or anyone&apos;s data in
            it.
          </p>
          <p>
            Some parts of the project are not ours to license onward — the
            typeface, the icon set, and other third-party assets carry their own
            terms, which are noted in the repository. Check them before reusing
            anything.
          </p>
          <p>
            If you contribute code, you confirm it is yours to give and you
            licence it under the same terms as the rest of the project, so that
            everyone downstream receives it on the same footing.
          </p>
        </>
      ),
    },
    {
      id: "third-party-services",
      title: "Third-Party Services and Content",
      body: (
        <>
          <p>
            Meraki shows content from other services and relies on them to work.
            We don&apos;t control that content and can&apos;t vouch for its
            accuracy, quality, or safety.
          </p>
          <p>
            In particular, Meraki uses <strong>YouTube API Services</strong> to
            find videos, and by using those features you also agree to the{" "}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              YouTube Terms of Service
            </a>
            . See{" "}
            <Link href="/privacy#who-we-share-with">Who We Share It With</Link>{" "}
            for what data this sends to Google and how to revoke access.
            Meraki also uses Google Maps and Places for local search, which is
            subject to Google&apos;s own terms.
          </p>
          <p>
            Workshops, classes, venues, and instructors surfaced by Find Nearby
            are not endorsed, vetted, or affiliated with us. Any dealings you
            have with them are between you and them.
          </p>
        </>
      ),
    },
    {
      id: "availability",
      title: "Availability and Changes",
      body: (
        <>
          <p>
            We may change, suspend, or remove features at any time. We do not
            promise that Meraki will be available without interruption or free
            of errors.
          </p>
          <p>
            Every hobby match, challenge, and piece of feedback costs real money
            in third-party API calls, paid personally by the operator. So we may
            set reasonable limits on how often features can be used, and may
            slow or pause an account whose usage is disproportionate or
            automated. We will try to do this in a way that never gets in the
            way of ordinary use.
          </p>
          <p>
            <strong>Meraki is a personal project and may not run forever.</strong>{" "}
            If we decide to discontinue it, you will not be charged anything —
            see{" "}
            <Link href="/privacy#retention">How Long We Keep Your Data</Link>{" "}
            for what happens to your data if that happens.
          </p>
        </>
      ),
    },
    {
      id: "termination",
      title: "Ending This Agreement",
      body: (
        <>
          <p>
            You can stop using Meraki whenever you like, and delete your account
            from Settings.
          </p>
          <p>
            We may suspend or terminate your account if you break these terms,
            if your use harms the service or other people, or if we are required
            to by law. Where it is reasonable to do so, we will tell you why and
            give you a chance to put it right first.
          </p>
          <p>
            When this agreement ends, the sections on your content licence, our
            content, disclaimers, liability, indemnity, and governing law
            continue to apply.
          </p>
        </>
      ),
    },
    {
      id: "disclaimers-and-liability",
      title: "Disclaimers, Liability, and Indemnity",
      body: (
        <>
          <p>
            Meraki is provided <strong>&ldquo;as is&rdquo;</strong> and{" "}
            <strong>&ldquo;as available&rdquo;</strong>, without warranties of
            any kind, whether express or implied, including any implied
            warranties of merchantability, fitness for a particular purpose, and
            non-infringement. We do not warrant that the service will be
            uninterrupted, secure, accurate, or that it will meet your
            requirements, and we do not promise any particular creative outcome.
            Your progress depends on your own practice. Some countries do not
            allow certain warranties to be excluded, so parts of this may not
            apply to you.
          </p>
          <p>
            To the fullest extent permitted by law, we are not liable for
            indirect, incidental, special, or consequential loss, or for lost
            profits, lost data, or lost goodwill, arising from your use of
            Meraki.
          </p>
          <p>
            Nothing in these terms excludes or limits our liability for death or
            personal injury caused by negligence, for fraud, or for anything
            else that cannot lawfully be excluded. If you are a consumer, you
            keep any rights the law of your country gives you that cannot be
            waived by agreement.
          </p>
          <p>
            <strong>Indemnity.</strong> If someone brings a claim against us
            because of how you used Meraki — for example because of content you
            uploaded, or because you broke these terms or the law — you agree
            to cover the reasonable costs and damages we incur as a result. We
            will tell you promptly about any such claim and will not settle it
            without talking to you first.
          </p>
        </>
      ),
    },
    {
      id: "governing-law",
      title: "Governing Law and Disputes",
      body: (
        <>
          <p>
            These terms are governed by the laws of {OPERATOR_COUNTRY}, and the
            courts of {OPERATOR_COUNTRY} have jurisdiction over any dispute. If
            you are a consumer resident elsewhere, this does not deprive you of
            the protection of the mandatory consumer laws of your own country.
          </p>
          <p>
            Before starting any formal proceedings, please email us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and give us{" "}
            <strong>30 days</strong> to try to resolve the matter with you. Most
            problems are easier to fix by talking about them.
          </p>
        </>
      ),
    },
    {
      id: "general",
      title: "General",
      body: (
        <>
          <h3>Whole agreement</h3>
          <p>
            These terms and the <Link href="/privacy">Privacy Policy</Link> are
            the entire agreement between us about Meraki, and replace anything
            said or written before.
          </p>

          <h3>If part of this is unenforceable</h3>
          <p>
            If any provision is found invalid or unenforceable, the rest stays in
            force, and that provision applies to the maximum extent the law
            allows.
          </p>

          <h3>Not enforcing something isn&apos;t giving it up</h3>
          <p>
            If we don&apos;t enforce a provision straight away, we can still
            enforce it later.
          </p>

          <h3>Transfers</h3>
          <p>
            You may not transfer your rights under this agreement to anyone else.
            We may transfer ours if Meraki is taken over by another operator, but
            only if your rights under these terms and the Privacy Policy are
            preserved — and we will tell you before it happens.
          </p>

          <h3>Changes to these terms</h3>
          <p>
            We may update these terms. We will change the date at the top, and if
            a change materially affects your rights we will tell you by email or
            in the app before it takes effect. Continuing to use Meraki after
            that means you accept the update; if you don&apos;t, you can delete
            your account.
          </p>

          <h3>Language</h3>
          <p>
            These terms are written in English. If they are translated and the
            versions differ, the English version applies.
          </p>
        </>
      ),
    },
  ],

  contact: {
    heading: "Still have questions?",
    body: (
      <>
        It doesn&apos;t have to be perfect — it just has to be yours. These terms
        exist to protect both of us so we can focus on what matters: making art
        you&apos;ll fall in love with making.
      </>
    ),
  },
};
