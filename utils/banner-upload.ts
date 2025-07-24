/**
 * Banner upload utility for Supabase storage
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface BannerUploadOptions {
  file: File;
  igdbId: number;
  slug: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

/**
 * Upload a banner image to Supabase storage
 */
export async function uploadBanner(
  supabase: SupabaseClient,
  options: BannerUploadOptions,
): Promise<string> {
  const {
    file,
    igdbId,
    slug,
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  } = options;

  const fileExt = file.name.split('.').pop();
  const fileName = `${igdbId}_${slug}_banner.${fileExt}`;
  const filePath = `banners/${fileName}`;

  // Validate file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`Banner file size must be less than ${maxSizeMB}MB`);
  }

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    const typesList = allowedTypes.join(', ');
    throw new Error(`Banner must be one of: ${typesList}`);
  }

  // Check if file already exists (for logging purposes)
  const { data: existingFile } = await supabase.storage
    .from('game-image-assets')
    .list('banners', {
      search: `${igdbId}_${slug}_banner`,
    });

  const fileExists = existingFile && existingFile.length > 0;

  if (fileExists) {
    console.log(`🔄 Replacing existing banner for game ${igdbId} (${slug})`);
  } else {
    console.log(`📤 Uploading new banner for game ${igdbId} (${slug})`);
  }

  // Upload the file
  const { error: uploadError } = await supabase.storage
    .from('game-image-assets')
    .upload(filePath, file, {
      upsert: true, // Replace existing file if it exists
    });

  if (uploadError) {
    throw new Error(`Failed to upload banner: ${uploadError.message}`);
  }

  // Get public URL with cache busting timestamp
  const { data } = supabase.storage
    .from('game-image-assets')
    .getPublicUrl(filePath);

  // Add cache busting parameter to ensure fresh image loads
  const timestamp = Date.now();
  const urlWithCacheBust = `${data.publicUrl}?updated=${timestamp}`;

  console.log(`✅ Banner uploaded successfully: ${urlWithCacheBust}`);

  return urlWithCacheBust;
}
