import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface SimpleReviewFormProps {
  brandId: number;
  onSuccess?: () => void;
}

export function SimpleReviewForm({ brandId, onSuccess }: SimpleReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const { toast } = useToast();

  const reviewMutation = useMutation({
    mutationFn: async () => {
      console.log("Submitting review with:", { brandId, rating, reviewText });
      const response = await apiRequest("POST", `/api/brands/${brandId}/reviews`, {
        brandId,
        rating,
        reviewText: reviewText || null,
        imageUrl: null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/brands/${brandId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({
        title: "Review submitted!",
        description: "Thank you for your review!",
      });
      setReviewText("");
      setRating(5);
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Review submission error:", error);
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted - rating:", rating, "text:", reviewText);
    reviewMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => {
                console.log("Star clicked:", star);
                setRating(star);
              }}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-1">{rating} star{rating !== 1 ? 's' : ''}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Review (Optional)</label>
        <Textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with this brand..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={reviewMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700 w-full"
          onClick={() => console.log("Submit button clicked in simple form")}
        >
          {reviewMutation.isPending ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </Button>
      </div>
    </form>
  );
}