import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { reason, feedback, locale = 'en' } = await req.json();

    // Validate input
    if (!reason || !feedback) {
      return NextResponse.json(
        { success: false, error: 'Reason and feedback are required' },
        { status: 400 },
      );
    }

    // Get Discord webhook URL from environment
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('DISCORD_WEBHOOK_URL is not configured');
      return NextResponse.json(
        { success: false, error: 'Webhook not configured' },
        { status: 500 },
      );
    }

    // Get current user info if available
    const user = await currentUser();
    const username = user?.username || user?.firstName || 'Anonymous';
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || 'Not provided';

    // Load translations from file
    const translationsPath = path.join(
      process.cwd(),
      'public',
      'locales',
      locale,
      'common.json',
    );
    let translations: any = {};

    try {
      const fileContents = fs.readFileSync(translationsPath, 'utf8');
      translations = JSON.parse(fileContents);
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to English if locale file doesn't exist
      const fallbackPath = path.join(
        process.cwd(),
        'public',
        'locales',
        'en',
        'common.json',
      );
      const fileContents = fs.readFileSync(fallbackPath, 'utf8');
      translations = JSON.parse(fileContents);
    }

    // Map reason values to translated labels
    const reasonLabels: Record<string, string> = {
      broken: translations.feedback_reason_broken || "Something's broken",
      'missing-game':
        translations.feedback_reason_missing_game ||
        "Didn't find the game I wanted",
      'add-games':
        translations.feedback_reason_add_games || 'Want to add more dead games',
      'feature-idea':
        translations.feedback_reason_feature_idea || 'I have a feature idea',
      other:
        translations.feedback_reason_other || 'Just wanted to say something',
    };

    const reasonLabel = reasonLabels[reason] || reason;

    // Create Discord embed message
    const discordPayload = {
      embeds: [
        {
          title: 'New Feedback Received',
          color: 0x5865f2,
          fields: [
            {
              name: 'Reason',
              value: reasonLabel,
              inline: false,
            },
            {
              name: 'Feedback',
              value: feedback,
              inline: false,
            },
            {
              name: 'User',
              value: username,
              inline: true,
            },
            {
              name: 'Email',
              value: userEmail,
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Feedback System',
          },
        },
      ],
    };

    // Send to Discord webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload),
    });

    if (!response.ok) {
      console.error('Discord webhook failed:', await response.text());
      return NextResponse.json(
        { success: false, error: 'Failed to send feedback' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
