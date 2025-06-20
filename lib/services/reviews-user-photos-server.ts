import { createClient } from '@/lib/supabase/server';

// Server-side functions for data loading (used in page.tsx and other server components)

export async function getPlaceReviews(placeId: string): Promise<any[]> {
  try {
    const supabase = await createClient();

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(
        `
        id,
        rating,
        comment,
        likes,
        created_at,
        updated_at,
        place_id,
        user_id,
        user:users(
          id,
          full_name,
          avatar
        )
      `
      )
      .eq('place_id', placeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching place reviews:', error);
      return [];
    }

    return reviews || [];
  } catch (error) {
    console.error('Error fetching place reviews:', error);
    return [];
  }
}

export async function getUserUploadedPhotos(placeId: string): Promise<any[]> {
  try {
    const supabase = await createClient();

    const { data: photos, error } = await supabase
      .from('user_uploaded_photos')
      .select(
        `
        id,
        photos,
        comment,
        likes,
        created_at,
        updated_at,
        place_id,
        user_id,
        user:users(
          id,
          full_name,
          avatar
        )
      `
      )
      .eq('place_id', placeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user uploaded photos:', error);
      return [];
    }

    return photos || [];
  } catch (error) {
    console.error('Error fetching user uploaded photos:', error);
    return [];
  }
}

export async function getUserReviewForPlace(
  placeId: string,
  userId: string
): Promise<any | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('reviews')
      .select(
        `
        *,
        user:users(
          id,
          full_name,
          avatar
        )
      `
      )
      .eq('place_id', placeId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting user review:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting user review:', error);
    return null;
  }
}

export async function getUserPhotosForPlace(
  placeId: string,
  userId: string
): Promise<any[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_uploaded_photos')
      .select(
        `
        *,
        user:users(
          id,
          full_name,
          avatar
        )
      `
      )
      .eq('place_id', placeId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user photos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting user photos:', error);
    return [];
  }
}
