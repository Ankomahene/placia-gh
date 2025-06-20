'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlaceResults, PlaceReview } from '@/types/place';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Flag,
  AlertCircle,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { createReview, updateReview } from '@/lib/services/reviews-user-photos';
import { toast } from 'sonner';
import Link from 'next/link';

interface PlaceReviewsProps {
  place: PlaceResults;
  platformReviews?: any[];
  userReview?: any | null;
  isLoggedIn: boolean;
}

interface GoogleReview {
  author_name: string;
  author_url: string;
  language: string;
  original_language: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number; // Unix timestamp
  translated: boolean;
}

export function PlaceReviews({
  place,
  platformReviews = [],
  userReview = null,
  isLoggedIn,
}: PlaceReviewsProps) {
  const router = useRouter();
  const { user } = useUser();
  const [rating, setRating] = useState(userReview?.rating || 0);
  const [reviewText, setReviewText] = useState(userReview?.comment || '');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Check if user already has a review
  const hasExistingReview = !!userReview;

  // Transform Google reviews to PlaceReview format
  const transformGoogleReviews = (
    googleReviews: GoogleReview[]
  ): PlaceReview[] => {
    return googleReviews.map((review, index) => ({
      id: `google-${place.id}-${index}`,
      place_id: place.id,
      user_id: `google-user-${index}`,
      user_name: review.author_name,
      user_avatar: review.profile_photo_url, // Use Google profile photo
      rating: review.rating,
      text: review.text,
      comment: review.text, // For consistency
      likes: [], // Google doesn't provide likes - initialize as empty array
      created_at: new Date(review.time * 1000), // Convert Unix timestamp to Date
      updated_at: new Date(review.time * 1000),
      // Store additional Google-specific data for potential use
      google_data: {
        author_url: review.author_url,
        relative_time_description: review.relative_time_description,
        language: review.language,
        translated: review.translated,
      },
    }));
  };

  // Transform platform reviews to PlaceReview format
  const transformPlatformReviews = (
    platformReviewsData: any[]
  ): PlaceReview[] => {
    return platformReviewsData.map((review) => ({
      id: review.id,
      place_id: review.place_id,
      user_id: review.user_id || 'platform-user',
      user_name: review.user?.full_name || 'Anonymous',
      user_avatar: review.user?.avatar,
      rating: review.rating,
      comment: review.comment, // Database field
      text: review.comment, // For backward compatibility
      likes: review.likes || [], // likes is an array of user IDs
      created_at: new Date(review.created_at),
      updated_at: new Date(review.updated_at || review.created_at),
      platform_data: {
        user_data: review.user,
      },
    }));
  };

  // Load reviews (Google and platform reviews from database only)
  useEffect(() => {
    // Get Google reviews from other_details if available
    const googleReviews: GoogleReview[] =
      place.other_details &&
      typeof place.other_details === 'object' &&
      'reviews' in place.other_details &&
      Array.isArray(place.other_details.reviews)
        ? (place.other_details.reviews as GoogleReview[])
        : [];

    const transformedGoogleReviews = transformGoogleReviews(googleReviews);
    const transformedPlatformReviews =
      transformPlatformReviews(platformReviews);

    // Combine real reviews: Google API reviews and platform database reviews
    // This allows for Google places to have additional reviews stored in our database
    const allReviews = [
      ...transformedGoogleReviews,
      ...transformedPlatformReviews,
    ].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    setReviews(allReviews);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place.other_details, place.id, platformReviews]);

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please log in to submit a review');
      return;
    }

    setIsSubmitting(true);

    try {
      if (hasExistingReview && isEditing) {
        // Update existing review
        await updateReview(userReview.id, {
          rating,
          comment: reviewText,
        });
        toast.success('Review updated successfully!');
        setIsEditing(false);
        router.refresh();
      } else if (!hasExistingReview) {
        // Create new review
        await createReview({
          place_id: place.id,
          rating,
          comment: reviewText,
        });
        toast.success('Review submitted successfully!');
        router.refresh();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit review'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setRating(userReview.rating);
    setReviewText(userReview.comment);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setRating(userReview.rating);
    setReviewText(userReview.comment);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Rating summary */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="text-center">
          <div className="text-5xl font-bold">
            {place.rate_average?.toFixed(1) || '0.0'}
          </div>
          <div className="flex items-center justify-center mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'h-5 w-5',
                  star <= (place.rate_average || 0)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {place.rate_count || 0} reviews
          </div>
        </div>

        <div className="flex-1 w-full">
          {/* Rating distribution bars */}
          <div className="space-y-2 w-full">
            {[5, 4, 3, 2, 1].map((num) => {
              // Calculate percentage based on all reviews
              const count = reviews.filter(
                (r) => Math.floor(r.rating) === num
              ).length;
              const percentage =
                reviews.length > 0
                  ? Math.floor((count / reviews.length) * 100)
                  : 0;

              return (
                <div key={num} className="flex items-center gap-2">
                  <div className="flex items-center w-16">
                    <span className="text-sm">{num}</span>
                    <Star className="h-4 w-4 ml-1 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Write a review section */}
      {isLoggedIn ? (
        <div className="bg-muted/30 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {userReview && !isEditing
                ? 'Your Review'
                : userReview && isEditing
                  ? 'Edit Your Review'
                  : 'Write a Review'}
            </h3>
            {userReview && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {/* Show existing review if not editing */}
          {userReview && !isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-5 w-5',
                      star <= userReview.rating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    )}
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-2">
                  {userReview.rating}/5 stars
                </span>
              </div>
              <p className="text-muted-foreground">{userReview.text}</p>
              <p className="text-xs text-muted-foreground">
                {userReview.updated_at !== userReview.created_at
                  ? `Updated ${new Date(userReview.updated_at).toLocaleDateString()}`
                  : `Posted ${new Date(userReview.created_at).toLocaleDateString()}`}
              </p>
            </div>
          ) : (
            /* Review form for new review or editing */
            <div className="space-y-4">
              {/* Star rating input */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Your rating:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="p-1"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(star)}
                      disabled={isSubmitting}
                    >
                      <Star
                        className={cn(
                          'h-6 w-6 transition-colors',
                          star <= (hoveredStar || rating)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review text input */}
              <Textarea
                placeholder="Share your experience with this place..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="min-h-[100px]"
                disabled={isSubmitting}
              />

              <div className="flex justify-end gap-2">
                {isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleSubmitReview}
                  disabled={rating === 0 || !reviewText.trim() || isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting
                    ? 'Submitting...'
                    : userReview && isEditing
                      ? 'Update Review'
                      : 'Submit Review'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p>Please log in to write a review</p>
          </div>
          <div className="flex gap-2">
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xl">Reviews</h3>
          {reviews.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {reviews.length} total reviews
            </div>
          )}
        </div>

        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => {
              const isGoogleReview = review.id.startsWith('google-');
              const isPlatformReview =
                review.id &&
                !review.id.startsWith('google-') &&
                !review.id.startsWith('new-');

              return (
                <div key={review.id} className="border-b pb-6 last:border-0">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={review.user?.avatar || ''}
                          alt={review.user?.full_name || ''}
                        />
                        <AvatarFallback>
                          {review.user?.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          {isGoogleReview && review.google_data?.author_url ? (
                            <a
                              href={review.google_data.author_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {review.user?.full_name}
                            </a>
                          ) : (
                            <h4 className="font-medium">
                              {review.user?.full_name}
                            </h4>
                          )}
                          {isGoogleReview && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              Google
                            </Badge>
                          )}
                          {isPlatformReview && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-green-50 text-green-700 border-green-200"
                            >
                              Platform
                            </Badge>
                          )}
                          {review.google_data?.translated && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                            >
                              Translated
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  'h-3 w-3',
                                  star <= review.rating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300'
                                )}
                              />
                            ))}
                          </div>
                          <span>•</span>
                          <span>
                            {isGoogleReview &&
                            review.google_data?.relative_time_description
                              ? review.google_data.relative_time_description
                              : review.created_at.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-muted-foreground">
                    {review.text || review.comment}
                  </p>

                  <div className="flex gap-4 mt-3">
                    {!isGoogleReview && (
                      <>
                        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                          <ThumbsUp className="h-4 w-4" />
                          <span>Helpful ({review.likes})</span>
                        </button>

                        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                          <MessageSquare className="h-4 w-4" />
                          <span>Reply</span>
                        </button>

                        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                          <Flag className="h-4 w-4" />
                          <span>Report</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No reviews yet. Be the first to review this place!</p>
          </div>
        )}
      </div>
    </div>
  );
}
