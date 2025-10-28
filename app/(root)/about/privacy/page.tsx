import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { AboutPageLayout } from '@/components/layouts/about-page-layout';

export const metadata: Metadata = {
  title: 'Privacy Policy - Dissgame',
  description:
    'How we handle your data at Dissgame - straight talk about privacy.',
};

export default function PrivacyPolicyPage() {
  return (
    <AboutPageLayout
      title="Privacy Policy"
      description="Hey there! Dissgame is an indie project, so let's keep this simple and transparent. Here's what we do with your data."
      lastUpdated="October 20, 2025"
    >
      {/* TL;DR */}
        <section className="rounded-lg bg-purple-900/20 p-6">
          <h2 className="mb-3 text-xl font-semibold text-purple-400">TL;DR</h2>
          <ul className="space-y-2 text-gray-300">
            <li>
              ✓ We collect minimal data - just what&apos;s needed to run the
              site
            </li>
            <li>
              ✓ Your game ratings and dislikes are anonymous and aggregated
            </li>
            <li>✓ We use Clerk for login and Supabase for database storage</li>
            <li>
              ✓ Your search history stays in your browser, not our servers
            </li>
            <li>✓ We don&apos;t sell your data to anyone, period</li>
            <li>✓ You can delete your account anytime</li>
          </ul>
        </section>

        {/* 1. What We Collect */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            1. What We Collect
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-medium text-purple-400">
                When you sign up:
              </h3>
              <p className="text-gray-300">
                Your email and username (handled by Clerk authentication). We
                also get your profile pic if you add one.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-medium text-purple-400">
                When you use the site:
              </h3>
              <ul className="list-inside list-disc space-y-1 text-gray-300">
                <li>
                  Games you dislike, rate, or mark as dead (stored anonymously)
                </li>
                <li>Emoji reactions on dead games</li>
                <li>
                  Search history (stored locally in your browser, we don&apos;t
                  see it!)
                </li>
                <li>
                  A session ID so we can show how many people are online and
                  prevent spam
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-medium text-purple-400">
                Technical stuff:
              </h3>
              <p className="text-gray-300">
                Basic analytics like your IP address, browser type, and which
                pages you visit. Nothing creepy, just enough to keep the site
                running smoothly.
              </p>
            </div>
          </div>
        </section>

        {/* 2. How We Use It */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            2. How We Use Your Data
          </h2>
          <p className="text-gray-300">Pretty straightforward:</p>
          <ul className="list-inside list-disc space-y-2 text-gray-300">
            <li>Make the site work (duh)</li>
            <li>Show you&apos;re logged in</li>
            <li>Display game stats and ratings</li>
            <li>
              Count how many people are online (your session ID expires after 24
              hours)
            </li>
            <li>
              Stop spam and abuse - we have rate limits (100 clicks per minute
              for dislikes/reactions, 20 per minute for submissions)
            </li>
            <li>
              Handle feedback you send through our Discord integration (only if
              you use the feedback button)
            </li>
            <li>Improve the site based on how people use it</li>
          </ul>
        </section>

        {/* 3. Where It's Stored */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            3. Where Your Data Lives
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-gray-300">
                <strong className="text-purple-400">Supabase:</strong> Our
                database. It&apos;s a PostgreSQL database with row-level
                security, so your data is protected.
              </p>
            </div>
            <div>
              <p className="text-gray-300">
                <strong className="text-purple-400">Clerk:</strong> Handles all
                the login stuff. They&apos;re pros at this.
              </p>
            </div>
            <div>
              <p className="text-gray-300">
                <strong className="text-purple-400">Your Browser:</strong> Your
                search history and preferences (like whether you&apos;ve seen
                the welcome dialog) stay on your device. You can clear it
                anytime in your browser settings.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-gray-800 p-4">
            <p className="text-sm text-gray-300">
              <strong>Security note:</strong> We use HTTPS, database security
              rules, and rate limiting. But honestly? No system is 100% secure.
              We do our best, but can&apos;t guarantee perfection.
            </p>
          </div>
        </section>

        {/* 4. Cookies */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">4. Cookies</h2>
          <p className="text-gray-300">
            We use cookies, but only the necessary ones:
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-300">
            <li>
              <strong>Login cookies</strong> from Clerk (so you stay logged in)
            </li>
            <li>
              <strong>Session tracking</strong> (to show online user count and
              prevent duplicate reactions)
            </li>
          </ul>
          <p className="mt-3 text-gray-300">
            No tracking cookies, no advertising cookies, no analytics cookies.
            Just the basics to make the site work.
          </p>
        </section>

        {/* 5. What's Public */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            5. What&apos;s Public vs Private
          </h2>

          <div className="space-y-3">
            <div>
              <h3 className="mb-2 text-lg font-medium text-purple-400">
                Public (everyone can see):
              </h3>
              <ul className="list-inside list-disc space-y-1 text-gray-300">
                <li>Total dislike counts for games (not who clicked)</li>
                <li>Aggregated ratings and stats</li>
                <li>Emoji reaction counts</li>
                <li>Number of people online (just the count, not who)</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-medium text-purple-400">
                Private:
              </h3>
              <p className="text-gray-300">
                Which specific games you disliked or rated. We don&apos;t show
                that to anyone.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Third Parties */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            6. Who Else Gets Your Data
          </h2>
          <p className="text-gray-300">
            We share data with these services to make Dissgame work:
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-300">
            <li>
              <strong>Clerk</strong> - Handles authentication
            </li>
            <li>
              <strong>Supabase</strong> - Stores our database
            </li>
            <li>
              <strong>Discord</strong> - Only gets your feedback if you submit
              it through the feedback form
            </li>
            <li>
              <strong>IGDB & Steam</strong> - We fetch game data from them, but
              don&apos;t send them your personal info
            </li>
          </ul>
          <p className="mt-3 text-gray-300">
            We might share data if legally required (like a court order), but
            that&apos;s it.
          </p>
        </section>

        {/* 7. Your Rights */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">7. Your Rights</h2>
          <p className="text-gray-300">You can:</p>
          <ul className="list-inside list-disc space-y-2 text-gray-300">
            <li>Request to see what data we have about you</li>
            <li>Ask us to correct wrong information</li>
            <li>
              Delete your account (and we&apos;ll remove your data within 30
              days)
            </li>
            <li>Export your data</li>
            <li>
              Withdraw consent for data processing (though this might break some
              features)
            </li>
          </ul>
          <p className="mt-3 text-gray-300">
            Just reach out through the feedback system or contact info below.
          </p>
        </section>

        {/* 8. Data Retention */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            8. How Long We Keep Your Data
          </h2>
          <ul className="list-inside list-disc space-y-2 text-gray-300">
            <li>
              <strong>Account data:</strong> As long as your account exists
            </li>
            <li>
              <strong>Game ratings/dislikes:</strong> We keep these to maintain
              accurate stats, even if you delete your account (but they&apos;re
              anonymous anyway)
            </li>
            <li>
              <strong>Session IDs:</strong> Expire after 24 hours
            </li>
            <li>
              <strong>After account deletion:</strong> 30 days to clean
              everything up
            </li>
          </ul>
        </section>

        {/* 9. Legal Stuff */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            9. Required Legal Stuff
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-medium text-purple-400">
                For EU users (GDPR):
              </h3>
              <p className="text-gray-300">
                You have extra rights like data portability and the right to
                object to processing. Our legal basis is: your consent when you
                sign up, contract necessity to provide services, and legitimate
                interest for security/fraud prevention.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-medium text-purple-400">
                For California users (CCPA):
              </h3>
              <p className="text-gray-300">
                You have rights to know what we collect, delete your data, and
                opt-out of sales. <strong>Good news:</strong> We don&apos;t sell
                your data, so nothing to opt out of.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-medium text-purple-400">
                Kids:
              </h3>
              <p className="text-gray-300">
                Dissgame isn&apos;t for anyone under 13. If you&apos;re a parent
                and think your kid signed up, let us know and we&apos;ll delete
                their data.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-medium text-purple-400">
                International transfers:
              </h3>
              <p className="text-gray-300">
                Your data might be processed outside your country. Our providers
                (Clerk, Supabase) use standard protections for this.
              </p>
            </div>
          </div>
        </section>

        {/* 10. Links to Other Sites */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            10. Links to Other Sites
          </h2>
          <p className="text-gray-300">
            We link to Steam pages, IGDB, and game developer sites. We&apos;re
            not responsible for their privacy practices - check their policies
            if you&apos;re curious.
          </p>
        </section>

        {/* 11. Changes */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            11. Changes to This Policy
          </h2>
          <p className="text-gray-300">
            If we update this policy, we&apos;ll change the &quot;Last
            Updated&quot; date at the top. For big changes, we might post a
            notice on the homepage or send an email.
          </p>
        </section>

        {/* Footer */}
        <section className="space-y-4">
          <p className="text-gray-300">
            By using Dissgame, you&apos;re cool with this privacy policy. For
            more info about how to use the site responsibly, check out our{' '}
            <Link
              href="/about/terms"
              className="text-purple-400 underline hover:text-purple-300"
            >
              Terms of Use
            </Link>
            .
          </p>
        </section>
    </AboutPageLayout>
  );
}
