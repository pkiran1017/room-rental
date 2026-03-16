import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse images from various formats (string or array)
 * Handles JSON strings, arrays, and invalid formats
 */
export function parseImages(images: unknown): string[] {
  // If already an array, return it
  if (Array.isArray(images)) {
    return images.filter(img => typeof img === 'string' && img.trim().length > 0);
  }

  // If it's a string, try to parse as JSON
  if (typeof images === 'string' && images.trim().length > 0) {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        return parsed.filter(img => typeof img === 'string' && img.trim().length > 0);
      }
    } catch {
      // Not valid JSON, return empty array
    }
  }

  return [];
}

/**
 * Get the first image from images (handles both formats)
 */
export function getFirstImage(images: unknown): string {
  const parsed = parseImages(images);
  return parsed.length > 0 ? parsed[0] : '';
}

/**
 * Format profile image URL to use the correct API base URL
 * Handles relative paths like /uploads/profiles/filename
 */
export function getProfileImageUrl(profileImage: string | null | undefined): string {
  if (!profileImage) return '';
  
  // If it's already a full URL (starts with http:// or https://), return as-is
  if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
    return profileImage;
  }
  
  // If it's a relative path, prepend the API base URL (without /api)
  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = profileImage.startsWith('/') ? profileImage : `/${profileImage}`;
  
  return `${apiBaseUrl}${cleanPath}`;
}

export function toSlug(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function buildRoomPath(roomId: string | number, title?: string, area?: string, city?: string): string {
  const slugSource = [title, area, city].filter(Boolean).join('-');
  const slug = toSlug(slugSource);
  return slug ? `/room/${roomId}/${slug}` : `/room/${roomId}`;
}

export function buildBrokerPath(brokerIdOrUniqueId: string | number, brokerName?: string): string {
  const slug = toSlug(String(brokerName || ''));
  return slug ? `/broker/${brokerIdOrUniqueId}/${slug}` : `/broker/${brokerIdOrUniqueId}`;
}
