import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Star, Instagram, ArrowLeft, User, Calendar } from "lucide-react";
import { Brand, Review } from "@shared/schema";
import { Link } from "wouter";
import ReviewForm from "@/components/brands/review-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ReviewWithUser extends Review {
  userInstagramHandle: string;
}

export default function BrandDetailPage() {
  const params = useParams();
  const brandId = parseInt(params.id || "0");

  console.log("Brand Detail Page - params:", params, "brandId:", brandId);

  const { data: brand, isLoading: brandLoading, error: brandError } = useQuery<Brand & { averageRating?: number; reviewCount?: number; categoryName?: string }>({
    queryKey: [`/api/brands/${brandId}`],
    enabled: !!brandId && brandId > 0,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<ReviewWithUser[]>({
    queryKey: [`/api/brands/${brandId}/reviews`],
    enabled: !!brandId && brandId > 0,
  });

  console.log("Brand data:", brand, "Error:", brandError);

  if (brandLoading || reviewsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!brandId || brandId <= 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Invalid Brand ID</h2>
            <p className="text-gray-600 mb-4">The URL is not valid. Brand ID: {params.id}</p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!brand && !brandLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Brand Not Found</h2>
            <p className="text-gray-600 mb-4">The brand you're looking for doesn't exist. ID: {brandId}</p>
            <p className="text-sm text-gray-500 mb-4">Error: {brandError?.message}</p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayRating = brand.averageRating ? brand.averageRating.toFixed(1) : "0.0";
  const reviewText = brand.reviewCount === 1 ? "review" : "reviews";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Back button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Brands
          </Button>
        </Link>

        {/* Brand header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                {brand.logoUrl ? (
                  <img 
                    src={brand.logoUrl} 
                    alt={`${brand.name} logo`}
                    className="w-24 h-24 rounded-full object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-3xl">
                      {brand.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Brand info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{brand.name}</h1>
                    <div className="flex items-center text-gray-600 mb-2">
                      <Instagram className="w-4 h-4 mr-2" />
                      <span>@{brand.instagramHandle}</span>
                    </div>
                    {brand.categoryName && (
                      <Badge variant="secondary" className="mb-3">
                        {brand.categoryName}
                      </Badge>
                    )}
                    {brand.description && (
                      <p className="text-gray-700 leading-relaxed">{brand.description}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-3">
                    {/* Rating */}
                    <div className="flex items-center">
                      <div className="flex items-center mr-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(brand.averageRating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xl font-semibold text-gray-900">{displayRating}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({brand.reviewCount || 0} {reviewText})
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button variant="outline" asChild>
                        <a 
                          href={`https://instagram.com/${brand.instagramHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center"
                        >
                          <Instagram className="w-4 h-4 mr-2" />
                          Visit Store
                        </a>
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>Write Review</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review {brand.name}</DialogTitle>
                            <DialogDescription>
                              Share your experience shopping with @{brand.instagramHandle}
                            </DialogDescription>
                          </DialogHeader>
                          <ReviewForm brandId={brand.id} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Reviews
              {reviews && reviews.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!reviews || reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">No reviews yet. Be the first to review this brand!</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Write First Review</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Review {brand.name}</DialogTitle>
                      <DialogDescription>
                        Share your experience shopping with @{brand.instagramHandle}
                      </DialogDescription>
                    </DialogHeader>
                    <ReviewForm brandId={brand.id} />
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {review.userInstagramHandle.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">@{review.userInstagramHandle}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {review.reviewText && (
                      <p className="text-gray-700 leading-relaxed mb-3">{review.reviewText}</p>
                    )}
                    
                    {review.imageUrl && (
                      <img 
                        src={review.imageUrl} 
                        alt="Review"
                        className="max-w-sm rounded-lg shadow-md"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}