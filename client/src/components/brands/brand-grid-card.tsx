import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Star, Instagram, Heart, User } from "lucide-react";
import { Brand } from "@shared/schema";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReviewForm from "./review-form";
import { SimpleReviewForm } from "./simple-review-form";
import { AllReviewsDialog } from "./all-reviews-dialog";

interface ReviewWithUser {
  id: number;
  userId: number;
  brandId: number;
  rating: number;
  reviewText: string | null;
  imageUrl: string | null;
  createdAt: Date;
  userInstagramHandle: string;
}

interface BrandGridCardProps {
  brand: Brand & { 
    averageRating?: number; 
    reviewCount?: number;
    categoryName?: string;
  };
}

export function BrandGridCard({ brand }: BrandGridCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const displayRating = brand.averageRating ? brand.averageRating.toFixed(1) : "0.0";
  const reviewText = brand.reviewCount === 1 ? "review" : "reviews";

  // Fetch recent reviews for this brand
  const { data: reviews } = useQuery<ReviewWithUser[]>({
    queryKey: [`/api/brands/${brand.id}/reviews`],
    enabled: !!brand.id,
  });

  const recentReviews = reviews?.slice(0, 2) || [];

  return (
    <Card className="group relative overflow-hidden bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-sm">
      {/* Header with logo/image area */}
      <div className="relative h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        {brand.logoUrl ? (
          <img 
            src={brand.logoUrl} 
            alt={`${brand.name} logo`}
            className="w-16 h-16 rounded-full object-cover shadow-md"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">
              {brand.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Category badge */}
        {brand.categoryName && (
          <Badge 
            variant="secondary" 
            className="absolute top-3 left-3 text-xs bg-white/90 backdrop-blur-sm border-0"
          >
            {brand.categoryName}
          </Badge>
        )}
        
        {/* Heart icon */}
        <button 
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600 hover:text-red-500'
            }`} 
          />
        </button>
      </div>
      
      <CardContent className="p-4">
        {/* Brand name and handle */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-gray-900 truncate mb-1">{brand.name}</h3>
          <div className="flex items-center text-sm text-gray-600">
            <Instagram className="w-3.5 h-3.5 mr-1" />
            <span>@{brand.instagramHandle}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(brand.averageRating || 0)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="ml-2 text-sm font-medium text-gray-900">{displayRating}</span>
          <span className="ml-1 text-xs text-gray-500">
            ({brand.reviewCount || 0} {reviewText})
          </span>
        </div>
        
        {/* Description */}
        {brand.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {brand.description}
          </p>
        )}

        {/* Recent Reviews */}
        {recentReviews.length > 0 && (
          <div className="mb-4 border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-gray-500 flex items-center">
                <User className="w-3 h-3 mr-1" />
                Recent Reviews
              </h4>
              {reviews && reviews.length > 0 && (
                <AllReviewsDialog brand={brand} trigger={
                  <button className="text-xs text-purple-600 font-medium hover:text-purple-800 transition-colors">
                    View all {reviews.length}
                  </button>
                } />
              )}
            </div>
            <div className="space-y-2">
              {recentReviews.map((review) => (
                <div key={review.id} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600">@{review.userInstagramHandle}</span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-2.5 h-2.5 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.reviewText && (
                    <p className="text-gray-600 line-clamp-2 leading-relaxed">
                      "{review.reviewText}"
                    </p>
                  )}
                </div>
              ))}
            </div>
            {reviews && reviews.length > 2 && (
              <AllReviewsDialog brand={brand} trigger={
                <button className="text-xs text-purple-600 mt-2 font-medium hover:text-purple-800 transition-colors">
                  +{reviews.length - 2} more reviews
                </button>
              } />
            )}
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-9 text-xs border-gray-300 hover:border-gray-400 hover:bg-gray-50" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(`https://instagram.com/${brand.instagramHandle}`, '_blank');
            }}
          >
            <Instagram className="w-4 h-4 mr-1" />
            Visit
          </Button>
          <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="flex-1 h-9 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                onClick={(e) => {
                  console.log("Review button clicked!", { brandId: brand.id, brandName: brand.name });
                  e.stopPropagation();
                  setIsReviewDialogOpen(true);
                }}
              >
                Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Review {brand.name}</DialogTitle>
                <DialogDescription>
                  Share your experience shopping with @{brand.instagramHandle}
                </DialogDescription>
              </DialogHeader>
              <SimpleReviewForm 
                brandId={brand.id} 
                onSuccess={() => setIsReviewDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}