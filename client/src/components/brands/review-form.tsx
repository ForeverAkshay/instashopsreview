import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReviewSchema } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const reviewFormSchema = insertReviewSchema.extend({
  rating: z.coerce.number().min(1).max(5),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

export default function ReviewForm({ brandId }: { brandId: number }) {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string>();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      brandId,
      rating: 5,
      reviewText: "",
      imageUrl: "",
    },
  });

  console.log("ReviewForm initialized with brandId:", brandId);
  console.log("Form state:", form.formState);

  const reviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      console.log("Submitting review:", data);
      const res = await apiRequest("POST", `/api/brands/${brandId}/reviews`, {
        ...data,
        imageUrl,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/brands/${brandId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({
        title: "Review submitted",
        description: "Thank you for your review!",
      });
      form.reset();
      setImageUrl("");
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a data URL for the uploaded image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Manual form submit triggered");
    const formData = form.getValues();
    console.log("Form data:", formData);
    console.log("Form errors:", form.formState.errors);
    
    if (!formData.rating) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    reviewMutation.mutate(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue="5">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a rating" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {"★".repeat(rating)}{"☆".repeat(5 - rating)} ({rating} star{rating !== 1 ? 's' : ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reviewText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share your experience with this brand..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <Input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Review photo preview"
              className="mt-2 max-h-40 rounded-md"
            />
          )}
        </div>

        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline" type="button" disabled={reviewMutation.isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button 
            type="button"
            disabled={reviewMutation.isPending}
            onClick={() => {
              console.log("Manual submit button clicked");
              const formData = form.getValues();
              console.log("Manual submit - form data:", formData);
              
              if (!formData.rating) {
                toast({
                  title: "Rating required",
                  description: "Please select a rating before submitting.",
                  variant: "destructive",
                });
                return;
              }
              
              reviewMutation.mutate(formData);
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {reviewMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Review (Direct)"
            )}
          </Button>
          <Button 
            type="submit" 
            disabled={reviewMutation.isPending}
            onClick={(e) => {
              console.log("Submit button clicked - event:", e);
              console.log("Current form values:", form.getValues());
            }}
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
    </Form>
  );
}
