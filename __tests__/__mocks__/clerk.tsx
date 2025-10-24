import { vi } from 'vitest';
import React from 'react';

export const mockUser = {
  id: 'user_123',
  firstName: 'Test',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
};

export const mockAuth = {
  userId: 'user_123',
  sessionId: 'session_123',
};

export const mockClerkClient = {
  users: {
    getUser: vi.fn(() => Promise.resolve(mockUser)),
  },
};

vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn(() => mockAuth),
  currentUser: vi.fn(() => Promise.resolve(mockUser)),
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-in-button">{children}</div>
  ),
  SignOutButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-out-button">{children}</div>
  ),
  UserButton: () => <div data-testid="user-button">User Menu</div>,
  useUser: vi.fn(() => ({
    user: mockUser,
    isLoaded: true,
    isSignedIn: true,
  })),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => mockAuth),
  currentUser: vi.fn(() => Promise.resolve(mockUser)),
  clerkClient: mockClerkClient,
}));
