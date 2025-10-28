import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { AboutPageLayout } from '@/components/layouts/about-page-layout';

export const metadata: Metadata = {
  title: 'FAQ - Dissgame',
  description:
    'Frequently Asked Questions about Dissgame - everything you need to know.',
};

export default function FAQPage() {
  return (
    <AboutPageLayout
      title="Frequently Asked Questions"
      description="Got questions? We've got answers!"
    >
      {/* About Dissgame */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-purple-400">
            About Dissgame
          </h2>

          <div className="space-y-4">
            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                What is Dissgame and why did you build it?
              </h3>
              <div className="space-y-3 text-gray-300">
                <p>
                  Dissgame is an indie project born out of frustration with
                  mainstream game rating websites.
                </p>
                <p>
                  Here&apos;s the thing: most game review sites are way too soft
                  on terrible games. You know those games that are absolute
                  garbage? Somehow they still get decent scores on major
                  platforms. It&apos;s frustrating!
                </p>
                <p>
                  So I built Dissgame - an unofficial, fun platform where
                  players can finally give the games they hate the bad reviews
                  they actually deserve. No corporate BS, no soft scores. Just
                  honest reactions from real players.
                </p>
                <p className="text-sm text-gray-400 italic">
                  Think of it as the &quot;thumbs down&quot; the gaming industry
                  needs.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                Is this serious or just for fun?
              </h3>
              <p className="text-gray-300">
                Both! We&apos;re serious about giving players a voice, but we
                keep the vibe light and fun. Rate games, dislike what you hate,
                react with emojis - it&apos;s all about having a good time while
                being brutally honest.
              </p>
            </div>

            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                Who runs Dissgame?
              </h3>
              <p className="text-gray-300">
                This is an indie project built and maintained by one developer
                (me!). It&apos;s a passion project, not backed by any
                corporation or game publisher. That&apos;s why we can be
                brutally honest.
              </p>
            </div>
          </div>
        </section>

        {/* Using the Site */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-purple-400">
            Using the Site
          </h2>

          <div className="space-y-4">
            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                Do I need an account to use Dissgame?
              </h3>
              <div className="space-y-3 text-gray-300">
                <p>
                  <strong>Short answer:</strong> Not for basic features, but we
                  recommend it.
                </p>
                <p>
                  <strong>What you can do without signing in:</strong>
                </p>
                <ul className="list-inside list-disc space-y-1 pl-4">
                  <li>Dislike games (just click away!)</li>
                  <li>Browse game stats and ratings</li>
                  <li>View dead games and reactions</li>
                </ul>
                <p>
                  <strong>What requires an account:</strong>
                </p>
                <ul className="list-inside list-disc space-y-1 pl-4">
                  <li>Rate games</li>
                  <li>Your own profile</li>
                  <li>Submit feedback</li>
                  <li>React with emojis</li>
                </ul>
                <p className="text-sm text-gray-400">
                  We use Clerk for authentication - it&apos;s secure and easy.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                How do I give games reactions?
              </h3>
              <p className="text-gray-300">
                Just click the buttons! Seriously, that&apos;s it. Click the
                dislike button, click emoji reactions - the more you click, the
                higher the count goes.
              </p>
            </div>

            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                What are &quot;Dead Games&quot;?
              </h3>
              <div className="space-y-3 text-gray-300">
                <p>
                  Dead Games is a special section showcasing games that are:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-4">
                  <li>Shut down or taken offline</li>
                  <li>Abandoned by developers</li>
                  <li>Servers are permanently closed</li>
                  <li>Have very few active players anymore</li>
                </ul>
                <p>
                  The community helps identify and mark these games. It&apos;s
                  like a graveyard for gaming&apos;s biggest failures and
                  abandonware.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Account & Privacy */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-purple-400">
            Account & Privacy
          </h2>

          <div className="space-y-4">
            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                Can I delete my account?
              </h3>
              <p className="text-gray-300">
                Yep! Just click on your profile icon and use Clerk&apos;s
                account dialog to manage or delete your account.
              </p>
            </div>

            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                Is my data safe?
              </h3>
              <div className="space-y-3 text-gray-300">
                <p>
                  <strong>Yes.</strong> We take security seriously:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-4">
                  <li>
                    <strong>Supabase:</strong> Industry-standard PostgreSQL
                    database with row-level security
                  </li>
                  <li>
                    <strong>Clerk:</strong> Professional authentication service
                    with OAuth support
                  </li>
                </ul>
                <p className="text-sm text-gray-400">
                  That said, no system is 100% secure. We do our best, but
                  can&apos;t guarantee perfection. Check our{' '}
                  <Link
                    href="/about/privacy"
                    className="text-purple-400 underline hover:text-purple-300"
                  >
                    Privacy Policy
                  </Link>{' '}
                  for details.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                What data do you collect?
              </h3>
              <div className="space-y-3 text-gray-300">
                <p>Only what&apos;s necessary:</p>
                <ul className="list-inside list-disc space-y-1 pl-4">
                  <li>Email and username (if you sign up)</li>
                  <li>Games you dislike/rate (anonymized in stats)</li>
                  <li>Session ID for online user count (expires after 24h)</li>
                  <li>
                    Search history (stored in your browser, not our servers!)
                  </li>
                </ul>
                <p>
                  <strong>We don&apos;t sell your data.</strong> Period.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                Can other people see what games I disliked?
              </h3>
              <p className="text-gray-300">
                Nope! Your dislikes and ratings are aggregated anonymously. We
                show total counts (like &quot;1,234 people disliked this
                game&quot;), but nobody can see that YOU specifically clicked
                that button.
              </p>
            </div>
          </div>
        </section>

        {/* Technical Questions */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-purple-400">
            Technical Stuff
          </h2>

          <div className="space-y-4">
            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                Where does the game data come from?
              </h3>
              <div className="space-y-3 text-gray-300">
                <p>We fetch game information from:</p>
                <ul className="list-inside list-disc space-y-1 pl-4">
                  <li>
                    <strong>IGDB (Internet Game Database):</strong> Game
                    metadata, images, descriptions
                  </li>
                  <li>
                    <strong>Steam API:</strong> Player counts and statistics
                  </li>
                </ul>
                <p className="text-sm text-gray-400">
                  We don&apos;t own this data - it belongs to the respective
                  platforms and game publishers.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                Is there an API I can use?
              </h3>
              <p className="text-gray-300">
                Not publicly available yet. This is an indie project and we need
                to manage server costs. If you&apos;re interested in API access,
                reach out via the feedback system!
              </p>
            </div>

            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                The site is down / not working. What do I do?
              </h3>
              <p className="text-gray-300">
                First, try refreshing the page or clearing your browser cache.
                If it&apos;s still broken, it might be a server issue
                (we&apos;re an indie project, stuff happens). Use the feedback
                system or check back later. We usually fix things pretty
                quickly.
              </p>
            </div>

            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                Can I contribute to Dissgame?
              </h3>
              <p className="text-gray-300">
                Appreciate the interest! Right now, the best way to contribute
                is by using the site and providing feedback. If you&apos;re a
                developer interested in helping out, drop a message through the
                feedback system.
              </p>
            </div>
          </div>
        </section>

        {/* Community & Moderation */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-purple-400">
            Community & Rules
          </h2>

          <div className="space-y-4">
            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                What happens if I abuse the system?
              </h3>
              <p className="text-gray-300">
                Don&apos;t be that person. If you use bots, create fake accounts
                to manipulate votes, or spam the site, we&apos;ll ban you.
                Simple as that. Check our{' '}
                <Link
                  href="/about/terms"
                  className="text-purple-400 underline hover:text-purple-300"
                >
                  Terms of Use
                </Link>{' '}
                for the full rules.
              </p>
            </div>

            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                How do you prevent fake reviews/votes?
              </h3>
              <div className="space-y-2 text-gray-300">
                <p>We have several measures:</p>
                <ul className="list-inside list-disc space-y-1 pl-4">
                  <li>Rate limits to prevent spam</li>
                  <li>Session tracking to detect suspicious patterns</li>
                  <li>IP-based throttling</li>
                  <li>Manual moderation when needed</li>
                </ul>
                <p className="text-sm text-gray-400">
                  No system is perfect, but we&apos;re constantly improving.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-800/50 p-6">
              <h3 className="mb-3 text-xl font-medium text-white">
                Can I report a problem or bug?
              </h3>
              <p className="text-gray-300">
                Absolutely! Use the feedback button in the app to report bugs,
                suggest features, or ask questions. Your feedback goes directly
                to us via Discord.
              </p>
            </div>
          </div>
        </section>

        {/* Links to other pages */}
        <section className="border-t border-gray-700 pt-6">
          <p className="mb-4 text-gray-300">You might also want to check:</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/about/terms"
              className="rounded-lg bg-gray-800 px-4 py-2 text-purple-400 transition-colors hover:bg-gray-700"
            >
              Terms of Use
            </Link>
            <Link
              href="/about/privacy"
              className="rounded-lg bg-gray-800 px-4 py-2 text-purple-400 transition-colors hover:bg-gray-700"
            >
              Privacy Policy
            </Link>
          </div>
        </section>
    </AboutPageLayout>
  );
}
