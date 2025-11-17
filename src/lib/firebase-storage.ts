/**
 * Firebase Storage utilities for image uploads
 */

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from './firebase';

const storage = getStorage(app);

/**
 * Upload restaurant profile image to Firebase Storage
 * @param userId - The user's unique ID
 * @param file - The image file to upload
 * @returns The download URL of the uploaded image
 */
export async function uploadRestaurantProfileImage(
  userId: string,
  file: File
): Promise<string> {
  try {
    // Create a unique filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `restaurant-profiles/${userId}/profile-${timestamp}.${fileExtension}`;
    
    // Create a storage reference
    const storageRef = ref(storage, filename);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
}

/**
 * Delete restaurant profile image from Firebase Storage
 * @param imageUrl - The full URL of the image to delete
 */
export async function deleteRestaurantProfileImage(imageUrl: string): Promise<void> {
  try {
    // Extract the path from the URL
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - deletion failures shouldn't block other operations
  }
}

/**
 * Validate image file
 * @param file - The file to validate
 * @returns true if valid, throws error if invalid
 */
export function validateImageFile(file: File): boolean {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Please upload a valid image file (JPEG, PNG, or WebP)');
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 5MB');
  }
  
  return true;
}

/**
 * Create a preview URL for a file
 * @param file - The file to create a preview for
 * @returns A temporary URL for previewing the image
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free up memory
 * @param previewUrl - The preview URL to revoke
 */
export function revokeImagePreview(previewUrl: string): void {
  URL.revokeObjectURL(previewUrl);
}
