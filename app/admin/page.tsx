'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@clerk/nextjs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { GameService, type IgdbGameData } from '@/lib/supabase/client';

// TODO: Only allow admin users to access this page

export default function AddGamePage() {
  const [igdbId, setIgdbId] = useState('');
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [formKey, setFormKey] = useState(0);
  const router = useRouter();
  const { isLoaded, isSignedIn, session } = useSession();

  // Redirect if not signed in (side effect)
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, router]);

  const gameService = useMemo(() => new GameService(session), [session]);

  // Handles form submission for adding/updating a game
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!igdbId) {
        toast.error('Please enter an IGDB game ID');
        return;
      }
      setLoading(true);
      try {
        // Fetch IGDB game data from local API
        const res = await fetch(`/api/igdb/games/${igdbId}`);
        if (!res.ok) {
          toast.error('Failed to fetch game data');
          setLoading(false);
          return;
        }
        const data: IgdbGameData = await res.json();

        // Simplified unified approach
        console.log(`📝 Processing game: ${data.name} (ID: ${data.id})`);
        if (bannerFile) {
          console.log(
            `🖼️ Banner file: ${bannerFile.name} (${(bannerFile.size / 1024 / 1024).toFixed(2)}MB)`,
          );
        }

        try {
          await gameService.addOrUpdateGame(data, bannerFile ?? undefined); // Single method call!

          const successMessage = bannerFile
            ? `Game "${data.name}" and banner uploaded successfully!`
            : `Game "${data.name}" added/updated successfully!`;
          toast.success(successMessage);

          // Reset form only on success
          setIgdbId('');
          setBannerFile(null);
          setFormKey((prev) => prev + 1);
        } catch (error) {
          console.error('Operation failed:', error);
          if (error instanceof Error) {
            // More specific error messages based on the error content
            if (error.message.includes('upload')) {
              toast.error(`Failed to upload banner: ${error.message}`);
            } else if (
              error.message.includes('save') ||
              error.message.includes('database')
            ) {
              toast.error(`Failed to save game: ${error.message}`);
            } else {
              toast.error(`Operation failed: ${error.message}`);
            }
          } else {
            toast.error('Operation failed');
          }
          return; // Don't reset form on failure
        }
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) {
          toast.error(err.message || 'Operation failed');
        } else if (typeof err === 'string') {
          toast.error(err);
        } else {
          toast.error('Operation failed');
        }
      } finally {
        setLoading(false);
      }
    },
    [igdbId, bannerFile, gameService],
  );

  if (isLoaded && !isSignedIn) {
    return null;
  }

  return (
    <div className="bg-card mx-auto mt-10 max-w-lg rounded-lg p-6 shadow">
      <h1 className="mb-6 text-2xl font-bold">Add IGDB Game</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* IGDB ID Input */}
        <div>
          <label htmlFor="igdb-id" className="text-sm font-medium">
            IGDB Game ID
          </label>
          <Input
            id="igdb-id"
            placeholder="Enter IGDB game ID"
            aria-label="IGDB game ID"
            value={igdbId}
            onChange={(e) => setIgdbId(e.target.value)}
            disabled={loading}
            className="mt-1"
          />
        </div>

        {/* Banner Upload */}
        <FileUpload
          key={`banner-${formKey}`}
          label="Game Banner (Optional)"
          onFileSelect={setBannerFile}
          accept="image/jpeg,image/png,image/webp"
          maxSize={5 * 1024 * 1024} // 5MB
        />

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          aria-label="Add or update game"
          className="w-full"
        >
          {loading ? 'Submitting...' : 'Add/Update Game'}
        </Button>

        {/* Upload Status */}
        {bannerFile && (
          <div className="text-muted-foreground text-sm">
            <p>✓ Banner selected: {bannerFile.name}</p>
          </div>
        )}
      </form>
    </div>
  );
}
