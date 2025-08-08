const IMGBB_API_KEY = '43827020431354e426c7f0f162dcfe76';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

interface ImgBBResponse {
  data: {
    url: string;
    display_url: string;
    delete_url: string;
  };
  success: boolean;
  status: number;
}

/**
 * Uploads an image to ImgBB.
 * @param base64Image - The image as a base64 encoded string (without the data:image/... prefix).
 * @param albumId - Optional album ID to organize images
 * @returns The URL of the uploaded image on success.
 * @throws Error if the upload fails.
 */
export async function uploadImageToImgBB(base64Image: string, albumId?: string): Promise<string> {
  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', base64Image);
  
  // Add album parameter if provided
  if (albumId) {
    formData.append('album', albumId);
  }

  const response = await fetch(IMGBB_API_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`ImgBB upload failed with status ${response.status}`);
  }

  const result: ImgBBResponse = await response.json();

  if (!result.success) {
    throw new Error('ImgBB upload was not successful');
  }

  return result.data.url;
}