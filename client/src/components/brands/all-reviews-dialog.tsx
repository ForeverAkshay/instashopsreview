import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Star, User, Calendar, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Brand } from "@shared/schema";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { format } from "date-fns";

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

interface AllReviewsDialogProps {
  brand: Brand & { averageRating?: number; reviewCount?: number };
  trigger: React.ReactNode;
}

export function AllReviewsDialog({ brand, trigger }: AllReviewsDialogProps) {
  const { data: reviews, isLoading } = useQuery<ReviewWithUser[]>({
    queryKey: [`/api/brands/${brand.id}/reviews`],
    enabled: !!brand.id,
  });

  const displayRating = brand.averageRating ? brand.averageRating.toFixed(1) : "0.0";

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-4 mb-4">
            {brand.logoUrl && (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="w-16 h-16 rounded-lg object-cover bg-gray-100"
              />
            )}
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold mb-2">
                All Reviews for {brand.name}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-4 text-base">
                <div className="flex items-center">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-semibold">{displayRating}</span>
                  <span className="text-gray-500 ml-1">
                    ({brand.reviewCount || 0} {brand.reviewCount === 1 ? "review" : "reviews"})
                  </span>
                </div>
                <Badge variant="secondary" className="text-sm">
                  @{brand.instagramHandle}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="px-6 pb-6" style={{ maxHeight: "60vh" }}>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">
                            @{review.userInstagramHandle}
                          </span>
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
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(review.createdAt), "MMM d, yyyy")}
                        </div>
                      </div>
                      
                      {review.reviewText && (
                        <p className="text-gray-700 mb-3 leading-relaxed">
                          {review.reviewText}
                        </p>
                      )}
                      
                      {review.imageUrl && (
                        <div className="mt-3">
                          <img
                            src={review.imageUrl}
                            alt="Review"
                            className="rounded-lg max-w-xs max-h-48 object-cover border border-gray-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">Be the first to review {brand.name}!</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}