import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBrandSchema } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { useState } from "react";
import { Upload } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const brandFormSchema = insertBrandSchema.extend({
  categoryId: z.coerce.number(),
});

type BrandFormData = z.infer<typeof brandFormSchema>;

export default function BrandForm() {
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      instagramHandle: "",
      description: "",
      logoUrl: "",
      websiteUrl: "",
      categoryId: 0, // Set a default numeric value instead of undefined
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is JPG or JPEG
      if (file.type === "image/jpeg" || file.type === "image/jpg") {
        setLogoFile(file);
        const reader = new FileReader();
        reader.onload = () => {
          setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload only JPG or JPEG images.",
          variant: "destructive",
        });
      }
    }
  };

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const brandMutation = useMutation({
    mutationFn: async (data: BrandFormData) => {
      let logoUrl = data.logoUrl;
      
      // If there's a logo file, upload it first
      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        
        const uploadRes = await fetch("/api/upload/logo", {
          method: "POST",
          body: formData,
        });
        
        if (uploadRes.ok) {
          const uploadResult = await uploadRes.json();
          logoUrl = uploadResult.logoUrl;
        }
      }
      
      const res = await apiRequest("POST", "/api/brands", { ...data, logoUrl });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      setLogoFile(null);
      setLogoPreview(null);
      form.reset();
      toast({
        title: "Brand Submitted!",
        description: "Your brand submission is pending admin approval and will be visible once approved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add brand",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => brandMutation.mutate(data))}
        className="space-y-4"
      >
        <div>
          <Input
            placeholder="Brand Name"
            {...form.register("name")}
          />
        </div>

        <div>
          <Input
            placeholder="Instagram Handle (without @)"
            {...form.register("instagramHandle")}
          />
        </div>

        <div>
          <Select
            value={form.watch("categoryId")?.toString() || "0"}
            onValueChange={(value) => form.setValue("categoryId", parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Input
            placeholder="Website URL (optional)"
            {...form.register("websiteUrl")}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo Upload (JPG/JPEG only)
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> logo
                  </p>
                  <p className="text-xs text-gray-500">JPG or JPEG only</p>
                </div>
                <Input
                  type="file"
                  accept=".jpg,.jpeg,image/jpeg"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>
            {logoPreview && (
              <div className="mt-2">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-20 h-20 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
        </div>
        
        <div>
          <Textarea
            placeholder="Brand Description"
            {...form.register("description")}
          />
        </div>

        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline" type="button" disabled={brandMutation.isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={brandMutation.isPending}>
            {brandMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Adding Brand...
              </>
            ) : (
              "Add Brand"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
