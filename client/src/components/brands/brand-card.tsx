import { useQuery } from "@tanstack/react-query";
import { Brand, ReviewWithUser } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ReviewForm from "./review-form";
import { StarIcon, Eye } from "lucide-react";
import { useState } from "react";
import { LoadingDots } from "@/components/ui/loading-spinner";

export default function BrandCard({ brand }: { brand: Brand }) {
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;
  
  const { data: reviews, isLoading: reviewsLoading } = useQuery<ReviewWithUser[]>({
    queryKey: [`/api/brands/${brand.id}/reviews`],
  });

  const averageRating =
    reviews && reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;

  const totalPages = reviews ? Math.ceil(reviews.length / reviewsPerPage) : 0;
  const paginatedReviews = reviews?.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  ) || [];

  const renderReview = (review: ReviewWithUser, isCompact = false) => (
    <div key={review.id} className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
          <span className="text-sm font-medium">{review.rating}</span>
        </div>
        <a
          href={`https://instagram.com/${review.userInstagramHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:underline"
        >
          @{review.userInstagramHandle}
        </a>
      </div>
      <div className="text-sm text-gray-600">
        {isCompact && review.reviewText.length > 100
          ? review.reviewText.substring(0, 97) + "..."
          : review.reviewText}
      </div>
      {review.imageUrl && (
        <img 
          src={review.imageUrl} 
          alt="Review photo" 
          className={`mt-2 rounded-md ${isCompact ? 'max-h-32' : 'max-h-48'}`} 
        />
      )}
      <div className="text-xs text-muted-foreground">
        {new Date(review.createdAt).toLocaleDateString()}
      </div>
    </div>
  );

  return (
    <Card className="brand-card">
      <CardHeader>
        <div className="flex items-start gap-3 mb-3">
          {brand.logoUrl && (
            <img
              src={brand.logoUrl}
              alt={`${brand.name} logo`}
              className="w-16 h-16 object-cover rounded-lg border"
            />
          )}
          <div className="flex-1">
            <CardTitle className="flex justify-between items-center">
              <span>{brand.name}</span>
              <div className="flex items-center">
                <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                <span>{averageRating.toFixed(1)}</span>
              </div>
            </CardTitle>
            <a
              href={`https://instagram.com/${brand.instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:underline"
            >
              @{brand.instagramHandle}
            </a>
          </div>
        </div>
        {brand.description && (
          <p className="text-sm text-gray-600 mt-2">{brand.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Recent Reviews</h3>
              {reviews && reviews.length > 2 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      View All ({reviews.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>All Reviews for {brand.name}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                      <div className="space-y-4">
                        {paginatedReviews.map((review) => (
                          <div key={review.id}>
                            {renderReview(review, false)}
                            <Separator className="mt-4" />
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="space-y-2">
              {reviewsLoading ? (
                <div className="flex items-center space-x-2 p-4">
                  <LoadingDots />
                  <span className="text-sm text-gray-500">Loading reviews...</span>
                </div>
              ) : (
                <>
                  {reviews?.slice(0, 2).map((review) => renderReview(review, true))}
                  {reviews && reviews.length === 0 && (
                    <p className="text-sm text-muted-foreground">No reviews yet</p>
                  )}
                </>
              )}
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">Write Review</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Review {brand.name}</DialogTitle>
              </DialogHeader>
              <ReviewForm brandId={brand.id} />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
