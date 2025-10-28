import React from 'react';
import Link from 'next/link';

/**
 * Props for AboutPageLayout component
 */
export interface AboutPageLayoutProps {
  /** Page title displayed in the header */
  title: string;
  /** Page description/subtitle displayed under the title */
  description: string;
  /** Optional last updated date displayed in header */
  lastUpdated?: string;
  /** Page content */
  children: React.ReactNode;
  /** Optional custom back button text (default: "Back to Home") */
  backButtonText?: string;
  /** Optional custom back button href (default: "/") */
  backButtonHref?: string;
}

/**
 * Shared layout component for about pages (FAQ, Privacy, Terms, etc.)
 *
 * Provides consistent structure with:
 * - Header section with title, description, and optional last updated date
 * - Content area with proper spacing
 * - Footer with back button
 *
 * @example
 * ```tsx
 * <AboutPageLayout
 *   title="Privacy Policy"
 *   description="How we handle your data"
 *   lastUpdated="October 20, 2025"
 * >
 *   <section>Your content here</section>
 * </AboutPageLayout>
 * ```
 */
export function AboutPageLayout({
  title,
  description,
  lastUpdated,
  children,
  backButtonText = 'Back to Home',
  backButtonHref = '/',
}: AboutPageLayoutProps) {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-gray-700 pb-6">
          <h1 className="mb-4 text-4xl font-bold text-white">{title}</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-400">Last Updated: {lastUpdated}</p>
          )}
          <p className="mt-4 text-lg text-gray-300">{description}</p>
        </div>

        {/* Content */}
        {children}

        {/* Footer - Back Button */}
        <div className="border-t border-gray-700 pt-6">
          <Link
            href={backButtonHref}
            className="inline-block rounded-lg bg-purple-600 px-6 py-3 text-white transition-colors hover:bg-purple-700"
          >
            {backButtonText}
          </Link>
        </div>
      </div>
    </main>
  );
}
