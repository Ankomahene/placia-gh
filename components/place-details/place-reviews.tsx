'use client';

import { useState, useEffect } from 'react';
import { PlaceResults, PlaceReview } from '@/types/place';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  Flag,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockPlaceReviews } from '@/lib/mock-place-reviews';

interface PlaceReviewsProps {
  place: PlaceResults;
  isLoggedIn: boolean;
}

export function PlaceReviews({ place, isLoggedIn }: PlaceReviewsProps) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  
  // Load mock reviews for this place
  useEffect(() => {
    if (place.slug && mockPlaceReviews[place.slug]) {
      setReviews(mockPlaceReviews[place.slug]);
    } else {
      setReviews([]);
    }
  }, [place.slug]);
  
  const handleSubmitReview = () => {
    // In a real app, this would submit the review to the backend
    console.log('Submitting review:', { rating, reviewText });
    
    // Create a mock new review
    const newReview: PlaceReview = {
      id: `new-${Date.now()}`,
      place_id: place.id,
      user_id: 'current-user',
      user_name: 'You',
      rating: rating,
      content: reviewText,
      likes: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Add to the reviews list
    setReviews([newReview, ...reviews]);
    
    // Reset form
    setRating(0);
    setReviewText('');
  };
  
  return (
    <div className="p-6 space-y-8">
      {/* Rating summary */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="text-center">
          <div className="text-5xl font-bold">{place.rate_average?.toFixed(1) || '0.0'}</div>
          <div className="flex items-center justify-center mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={cn(
                  "h-5 w-5", 
                  star <= (place.rate_average || 0) 
                    ? "text-yellow-500 fill-yellow-500" 
                    : "text-gray-300"
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
              // Calculate percentage based on mock reviews
              const count = reviews.filter(r => Math.floor(r.rating) === num).length;
              const percentage = reviews.length > 0 ? Math.floor((count / reviews.length) * 100) : 0;
              
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
          <h3 className="font-semibold">Write a Review</h3>
          
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
                >
                  <Star 
                    className={cn(
                      "h-6 w-6 transition-colors", 
                      (star <= (hoveredStar || rating)) 
                        ? "text-yellow-500 fill-yellow-500" 
                        : "text-gray-300"
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
          />
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmitReview}
              disabled={rating === 0 || !reviewText.trim()}
            >
              Submit Review
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p>Please log in to write a review</p>
          </div>
          <Button variant="outline">Log In</Button>
        </div>
      )}
      
      {/* Reviews list */}
      <div className="space-y-6">
        <h3 className="font-semibold text-xl">Reviews</h3>
        
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-6 last:border-0">
                <div className="flex justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={review.user_avatar} alt={review.user_name} />
                      <AvatarFallback>{review.user_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{review.user_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={cn(
                                "h-3 w-3", 
                                star <= review.rating 
                                  ? "text-yellow-500 fill-yellow-500" 
                                  : "text-gray-300"
                              )} 
                            />
                          ))}
                        </div>
                        <span>•</span>
                        <span>{review.created_at.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="mt-3 text-muted-foreground">{review.content}</p>
                
                <div className="flex gap-4 mt-3">
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
                </div>
              </div>
            ))}
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