/**
 * YouTube video validation utility
 */

// TODO: create a separate api for youtube validation

interface YouTubeVideoResponse {
  kind: string;
  etag: string;
  items: Array<{
    kind: string;
    etag: string;
    id: string;
    snippet?: {
      publishedAt: string;
      title: string;
      description: string;
    };
    contentDetails: {
      duration: string;
      dimension: string;
      definition: string;
      caption: string;
      licensedContent: boolean;
      contentRating?: {
        ytRating?: string;
      };
      projection: string;
    };
  }>;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

interface VideoWithMetadata {
  id: string;
  publishedAt: string;
}

/**
 * Check if a YouTube video is age restricted
 * @param videoId - YouTube video ID
 * @returns Promise<boolean> - true if age restricted, false otherwise
 */
async function isVideoAgeRestricted(videoId: string): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_YOUTUBE_API_KEY === undefined) {
    console.warn('YouTube API key not found, skipping video validation');
    return false;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`,
    );

    if (!response.ok) {
      console.warn(
        `Failed to fetch video details for ${videoId}: ${response.statusText}`,
      );
      return false;
    }

    const data: YouTubeVideoResponse = await response.json();

    if (data.items.length === 0) {
      console.warn(`Video ${videoId} not found`);
      return false;
    }

    const video = data.items[0];
    const contentRating = video.contentDetails.contentRating;

    return contentRating?.ytRating === 'ytAgeRestricted';
  } catch (error) {
    console.error(
      `Error checking age restriction for video ${videoId}:`,
      error,
    );
    return false;
  }
}

/**
 * Filter out age-restricted videos from an array of video IDs
 * @param videoIds - Array of YouTube video IDs
 * @returns Promise<string[]> - Array of non-age-restricted video IDs
 */
export async function filterAgeRestrictedVideos(
  videoIds: string[],
): Promise<string[]> {
  if (!videoIds || videoIds.length === 0) {
    return [];
  }
  if (process.env.NEXT_PUBLIC_YOUTUBE_API_KEY === undefined) {
    console.warn(
      'YouTube API key not found, returning all videos without validation',
    );
    return videoIds;
  }

  console.log(
    `🔍 Validating ${videoIds.length} YouTube videos for age restrictions...`,
  );

  const validVideos: string[] = [];

  // Process each video individually since the API can only handle one video ID at a time
  for (const videoId of videoIds) {
    try {
      const isAgeRestricted = await isVideoAgeRestricted(videoId);

      if (!isAgeRestricted) {
        validVideos.push(videoId);
      } else {
        console.log(`🚫 Filtered out age-restricted video: ${videoId}`);
      }
    } catch (error) {
      console.error(`Error checking video ${videoId}:`, error);
      // If we can't check a video, we'll include it to be safe
      validVideos.push(videoId);
    }
  }

  console.log(
    `✅ Validation complete: ${validVideos.length}/${videoIds.length} videos passed age restriction check`,
  );
  return validVideos;
}

/**
 * Sort videos by published date (latest first)
 * @param videoIds - Array of YouTube video IDs
 * @returns Promise<string[]> - Array of sorted video IDs (latest first)
 */
export async function sortVideosByDate(
  videoIds: string[] | undefined,
): Promise<string[]> {
  if (!videoIds || videoIds.length === 0) {
    return [];
  }
  if (process.env.NEXT_PUBLIC_YOUTUBE_API_KEY === undefined) {
    console.warn('YouTube API key not found, returning videos without sorting');
    return videoIds;
  }

  console.log(`🔍 Fetching metadata for ${videoIds.length} YouTube videos...`);

  const videosWithMetadata: VideoWithMetadata[] = [];

  // Process videos in batches of 50 (YouTube API limit)
  const batchSize = 50;
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const batchIds = batch.join(',');

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${batchIds}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`,
      );

      if (!response.ok) {
        console.warn(`Failed to fetch batch: ${response.statusText}`);
        // Add videos without sorting as fallback
        batch.forEach((id) =>
          videosWithMetadata.push({
            id,
            publishedAt: new Date().toISOString(),
          }),
        );
        continue;
      }

      const data: YouTubeVideoResponse = await response.json();

      for (const video of data.items) {
        videosWithMetadata.push({
          id: video.id,
          publishedAt: video.snippet?.publishedAt || new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`Error fetching batch:`, error);
      // Add videos without sorting as fallback
      batch.forEach((id) =>
        videosWithMetadata.push({
          id,
          publishedAt: new Date().toISOString(),
        }),
      );
    }
  }

  // Sort by publishedAt (latest first)
  videosWithMetadata.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const sortedVideoIds = videosWithMetadata.map((v) => v.id);

  console.log(
    `✅ Sorted ${sortedVideoIds.length}/${videoIds.length} videos by date (latest first)`,
  );

  return sortedVideoIds;
}
