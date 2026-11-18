import { photoUrl as url } from '@placia/core/photos';

export { photoKey } from '@placia/core/photos';

/** Public URL of a place photo (Cloudinary public id or Supabase storage path). */
export const photoUrl = (key: string, width?: number) => url(key, { width });
