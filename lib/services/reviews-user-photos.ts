import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Reviews
export async function createReview(data: {
  place_id: string;
  rating: number;
  comment?: string;
}): Promise<any> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      place_id: data.place_id,
      user_id: user.id,
      rating: data.rating,
      comment: data.comment,
      likes: [],
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating review:', error);
    throw error;
  }

  return review;
}

export async function updateReview(
  reviewId: string,
  data: {
    rating: number;
    comment?: string;
  }
): Promise<any> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  const { data: review, error } = await supabase
    .from('reviews')
    .update({
      rating: data.rating,
      comment: data.comment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('user_id', user.id) // Ensure user can only update their own review
    .select()
    .single();

  if (error) {
    console.error('Error updating review:', error);
    throw error;
  }

  return review;
}

export async function toggleReviewLike(
  reviewId: string,
  userId: string
): Promise<any> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  // First get the current review
  const { data: review, error: fetchError } = await supabase
    .from('reviews')
    .select('likes')
    .eq('id', reviewId)
    .single();

  if (fetchError) {
    console.error('Error fetching review:', fetchError);
    throw fetchError;
  }

  const currentLikes = review.likes || [];
  const hasLiked = currentLikes.includes(userId);

  let newLikes;
  if (hasLiked) {
    // Remove like
    newLikes = currentLikes.filter((id: string) => id !== userId);
  } else {
    // Add like
    newLikes = [...currentLikes, userId];
  }

  const { data: updatedReview, error } = await supabase
    .from('reviews')
    .update({ likes: newLikes })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling review like:', error);
    throw error;
  }

  return updatedReview;
}

export async function getUserReviewForPlace(placeId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('place_id', placeId)
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting user review:', error);
    return null;
  }

  return data;
}

// Photos
export async function createUserPhoto(data: {
  place_id: string;
  photos: string[];
  comment?: string;
}): Promise<any> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: photo, error } = await supabase
    .from('user_uploaded_photos')
    .insert({
      place_id: data.place_id,
      user_id: user.id,
      photos: data.photos,
      comment: data.comment,
      likes: [],
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user photo:', error);
    throw error;
  }

  return photo;
}

export async function togglePhotoLike(
  photoId: string,
  userId: string
): Promise<any> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  // First get the current photo
  const { data: photo, error: fetchError } = await supabase
    .from('user_uploaded_photos')
    .select('likes')
    .eq('id', photoId)
    .single();

  if (fetchError) {
    console.error('Error fetching photo:', fetchError);
    throw fetchError;
  }

  const currentLikes = photo.likes || [];
  const hasLiked = currentLikes.includes(userId);

  let newLikes;
  if (hasLiked) {
    // Remove like
    newLikes = currentLikes.filter((id: string) => id !== userId);
  } else {
    // Add like
    newLikes = [...currentLikes, userId];
  }

  const { data: updatedPhoto, error } = await supabase
    .from('user_uploaded_photos')
    .update({ likes: newLikes })
    .eq('id', photoId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling photo like:', error);
    throw error;
  }

  return updatedPhoto;
}

export async function getUserUploadedPhotos(placeId: string) {
  const { data: photos, error } = await supabase
    .from('user_uploaded_photos')
    .select('*')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user uploaded photos:', error);
    return [];
  }

  return photos || [];
}

export async function getUserPhotosForPlace(placeId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('user_uploaded_photos')
    .select('*')
    .eq('place_id', placeId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting user photos:', error);
    return [];
  }

  return data || [];
}
