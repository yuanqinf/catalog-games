import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use - Dissgame',
  description: 'The rules for using Dissgame - keep it simple and fair.',
};

export default function TermsOfUsePage() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 border-b border-gray-700 pb-6">
        <h1 className="mb-4 text-4xl font-bold text-white">Terms of Use</h1>
        <p className="text-sm text-gray-400">Last Updated: October 20, 2025</p>
        <p className="mt-4 text-lg text-gray-300">
          Welcome! Here are the rules for using Dissgame. We tried to keep it
          simple and straightforward.
        </p>
      </div>

      {/* TL;DR */}
      <section className="mb-8 rounded-lg bg-purple-900/20 p-6">
        <h2 className="mb-3 text-xl font-semibold text-purple-400">TL;DR</h2>
        <ul className="space-y-2 text-gray-300">
          <li>✓ Don&apos;t use bots or spam the site</li>
          <li>✓ Don&apos;t create fake accounts to manipulate votes</li>
          <li>✓ We have rate limits to keep things fair</li>
          <li>✓ Your ratings and reactions are public (but anonymous)</li>
          <li>✓ We can ban abusive accounts</li>
          <li>
            ✓ The site is provided &quot;as is&quot; - we do our best but
            can&apos;t guarantee perfection
          </li>
        </ul>
      </section>

      {/* Content */}
      <div className="space-y-8 text-gray-300">
        {/* 1. What Dissgame Does */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">
            1. What Dissgame Does
          </h2>
          <div className="space-y-3 leading-relaxed">
            <p>Dissgame is a community platform where you can:</p>
            <ul className="list-inside list-disc space-y-2 pl-4">
              <li>Dislike games and see what others dislike</li>
              <li>Rate games and view community ratings</li>
              <li>
                Mark games as &quot;dead&quot; and react with emojis (RIP,
                skull, etc.)
              </li>
              <li>Search for games and browse stats</li>
              <li>Submit feedback about the site</li>
            </ul>
          </div>
        </section>

        {/* 2. Your Account */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">
            2. Your Account
          </h2>
          <div className="space-y-3 leading-relaxed">
            <p>
              We use Clerk for authentication. When you sign up, you agree to:
            </p>
            <ul className="list-inside list-disc space-y-2 pl-4">
              <li>Use accurate info (no fake emails)</li>
              <li>Keep your password secure</li>
              <li>Not share your account with others</li>
              <li>Let us know if someone hacks your account</li>
            </ul>
            <p className="mt-3">
              We can suspend or ban accounts that break these rules or act
              abusively. You can delete your account anytime.
            </p>
          </div>
        </section>

        {/* 3. The Rules */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">
            3. What You Can&apos;t Do
          </h2>
          <div className="space-y-3 leading-relaxed">
            <p className="font-medium">Please don&apos;t:</p>
            <ul className="list-inside list-disc space-y-2 pl-4">
              <li>
                <strong>Use bots or scripts</strong> to auto-click dislikes or
                manipulate votes
              </li>
              <li>
                <strong>Create multiple accounts</strong> to inflate/deflate
                game ratings
              </li>
              <li>
                <strong>Spam the feedback system</strong> or submit offensive
                content
              </li>
              <li>
                <strong>Try to hack or break</strong> our servers, database, or
                APIs
              </li>
              <li>
                <strong>Scrape or harvest data</strong> from the site without
                permission
              </li>
              <li>
                <strong>Bypass rate limits</strong> or security measures
              </li>
              <li>
                <strong>Use Dissgame for illegal stuff</strong> (obviously)
              </li>
            </ul>
            <p className="mt-3 text-sm">
              Basically: be cool, don&apos;t be a jerk, and play fair.
            </p>
          </div>
        </section>

        {/* 4. Rate Limits */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">
            4. Rate Limits (Anti-Spam)
          </h2>
          <div className="space-y-3 leading-relaxed">
            <p>
              To keep things fair and prevent abuse, we limit how fast you can
              do stuff:
            </p>
            <ul className="list-inside list-disc space-y-2 pl-4">
              <li>
                <strong>Dislikes & reactions:</strong> 100 per minute
              </li>
              <li>
                <strong>Game submissions:</strong> 20 per minute
              </li>
            </ul>
            <p className="mt-3">
              If you hit these limits, you&apos;ll get a timeout. Repeatedly
              abusing them can get you banned.
            </p>
          </div>
        </section>

        {/* 5. Your Content */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">
            5. What You Post
          </h2>
          <div className="space-y-3 leading-relaxed">
            <p>When you rate games, dislike stuff, or send feedback:</p>
            <ul className="list-inside list-disc space-y-2 pl-4">
              <li>
                <strong>It&apos;s public:</strong> Your dislikes and ratings are
                visible (but aggregated and anonymous)
              </li>
              <li>
                <strong>You keep ownership:</strong> But you give us permission
                to display and use it
              </li>
              <li>
                <strong>We can moderate:</strong> We&apos;ll remove spam,
                offensive stuff, or content that breaks the rules
              </li>
            </ul>
          </div>
        </section>

        {/* 6. Who Owns What */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">
            6. Ownership & Copyright
          </h2>
          <div className="space-y-3 leading-relaxed">
            <div>
              <h3 className="mb-2 text-lg font-medium text-purple-400">
                Our stuff:
              </h3>
              <p>
                The Dissgame website, design, and features are ours. Don&apos;t
                copy or steal them.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-medium text-purple-400">
                Game data:
              </h3>
              <p>
                We get game info, images, and stats from IGDB, Steam, and other
                sources. We don&apos;t own this - it belongs to the respective
                game publishers and platforms.
              </p>
            </div>
          </div>
        </section>

        {/* 7. Privacy */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">7. Privacy</h2>
          <div className="space-y-3 leading-relaxed">
            <p>
              Check our{' '}
              <Link
                href="/about/privacy"
                className="text-purple-400 underline hover:text-purple-300"
              >
                Privacy Policy
              </Link>{' '}
              for the full details, but here&apos;s the quick version:
            </p>
            <ul className="list-inside list-disc space-y-2 pl-4">
              <li>We use Clerk for login, Supabase for database storage</li>
              <li>
                Your search history stays in your browser (not our servers)
              </li>
              <li>We track which games you dislike/rate (anonymously)</li>
              <li>We count online users with session IDs (expire after 24h)</li>
              <li>We don&apos;t sell your data</li>
            </ul>
          </div>
        </section>

        {/* 8. Third-Party Services */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">
            8. Third-Party Services
          </h2>
          <div className="space-y-3 leading-relaxed">
            <p>We integrate with these services to make Dissgame work:</p>
            <ul className="list-inside list-disc space-y-2 pl-4">
              <li>
                <strong>Clerk</strong> - Handles login/authentication
              </li>
              <li>
                <strong>Supabase</strong> - Our database backend
              </li>
              <li>
                <strong>IGDB</strong> - Game data and images
              </li>
              <li>
                <strong>Steam</strong> - Player counts and stats
              </li>
              <li>
                <strong>Discord</strong> - Feedback notifications
              </li>
            </ul>
            <p className="mt-3">
              We&apos;re not responsible if these services go down or have
              issues. Check their own terms/policies if you&apos;re curious.
            </p>
          </div>
        </section>

        {/* 9. Disclaimers */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">
            9. The Legal Stuff (Disclaimers)
          </h2>
          <div className="space-y-4 leading-relaxed">
            <div className="rounded-lg bg-gray-800 p-4">
              <p className="text-sm">
                <strong className="text-purple-400">
                  Important - Read This:
                </strong>{' '}
                Dissgame is provided &quot;AS IS&quot; without any guarantees.
                We do our best to keep things running smoothly, but we
                can&apos;t promise:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 pl-4 text-sm">
                <li>The site will always be available (servers can go down)</li>
                <li>
                  Game data is 100% accurate (it comes from third parties)
                </li>
                <li>Your data is completely secure (though we try hard)</li>
                <li>
                  IGDB, Steam, or other services will keep working (not our
                  call)
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-medium text-purple-400">
                Limitation of Liability:
              </h3>
              <p>
                We&apos;re not liable for any damages from using (or not being
                able to use) Dissgame. This includes:
              </p>
              <ul className="list-inside list-disc space-y-1 pl-4 text-sm">
                <li>Lost data or content</li>
                <li>Time wasted if the site breaks</li>
                <li>Issues from third-party services</li>
                <li>Any other indirect damages</li>
              </ul>
              <p className="mt-2 text-sm">
                Translation: This is a free indie project. Use at your own risk.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-medium text-purple-400">
                Indemnification (Fancy Legal Word):
              </h3>
              <p className="text-sm">
                If you break the rules and someone sues us because of it, you
                agree to cover the costs. Don&apos;t make us deal with legal
                trouble because you did something dumb.
              </p>
            </div>
          </div>
        </section>

        {/* 10. Changes to Terms */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">
            10. Changes to These Terms
          </h2>
          <div className="space-y-3 leading-relaxed">
            <p>
              We might update these terms occasionally. If we do, we&apos;ll
              update the &quot;Last Updated&quot; date at the top. For major
              changes, we might post a notice on the homepage.
            </p>
            <p>
              By continuing to use Dissgame after changes, you&apos;re agreeing
              to the new terms.
            </p>
          </div>
        </section>

        {/* Footer Note */}
        <section className="border-t border-gray-700 pt-6">
          <p className="text-gray-300">
            By using Dissgame, you agree to these Terms of Use and our{' '}
            <Link
              href="/about/privacy"
              className="text-purple-400 underline hover:text-purple-300"
            >
              Privacy Policy
            </Link>
            . If you don&apos;t agree, please don&apos;t use the site.
          </p>
          <p className="mt-3 text-sm text-gray-400">
            Thanks for being part of the community!
          </p>
        </section>
      </div>

      {/* Back to Home Link */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-block rounded-lg bg-purple-600 px-6 py-3 text-white transition-colors hover:bg-purple-700"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
