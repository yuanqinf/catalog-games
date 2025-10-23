/**
 * Utility functions for handling game images
 */

/**
 * Get image dimensions info for logging/debugging
 * @param file - The image file
 * @returns Promise with image dimensions
 */
export function getImageInfo(
  file: File,
): Promise<{ width: number; height: number; size: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Validate image file before upload
 * @param file - The image file to validate
 * @param maxSizeMB - Maximum file size in MB (default: 5)
 * @returns Validation result with error message if invalid
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5,
): { isValid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please select a valid image file (JPEG, PNG, or WebP)',
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
}

/**
 * Generate a preview URL for a file with automatic cleanup
 * @param file - The image file
 * @returns Preview URL (remember to revoke when done)
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Clean up a preview URL
 * @param previewUrl - The preview URL to clean up
 */
export function cleanupImagePreview(previewUrl: string): void {
  URL.revokeObjectURL(previewUrl);
}
