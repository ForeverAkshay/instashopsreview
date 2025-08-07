import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brand, Category } from "@shared/schema";
import BrandSearch from "@/components/brands/brand-search";
import BrandCard from "@/components/brands/brand-card";
import { BrandGridCard } from "@/components/brands/brand-grid-card";
import BrandForm from "@/components/brands/brand-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { SkeletonCard, LoadingSpinner } from "@/components/ui/loading-spinner";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Create a proper API query string with parameters
  const getQueryString = () => {
    const params = new URLSearchParams();
    
    if (selectedCategory && selectedCategory !== "all") {
      params.append("categoryId", selectedCategory);
    }
    
    if (searchQuery) {
      params.append("q", searchQuery);
    }
    
    const queryString = params.toString();
    return queryString ? `/api/brands?${queryString}` : "/api/brands";
  };

  const { data: brands, isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ["/api/brands", selectedCategory, searchQuery],
    queryFn: async () => {
      const response = await fetch(getQueryString());
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 page-transition">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Discover Instagram Brands
            </h1>
            <p className="mt-2 text-gray-600">
              Search, review, and explore authentic Instagram businesses
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Brand</DialogTitle>
              </DialogHeader>
              <BrandForm />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-64">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                disabled={categoriesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={categoriesLoading ? "Loading..." : "All Categories"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <BrandSearch onSearch={setSearchQuery} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {brandsLoading ? (
            // Show skeleton cards while loading
            Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))
          ) : (
            <>
              {brands?.map((brand: Brand) => (
                <BrandGridCard key={brand.id} brand={brand} />
              ))}
              {brands?.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  {searchQuery ? (
                    <p>No brands found matching "{searchQuery}". Try a different search term or add this brand.</p>
                  ) : (
                    <p>No brands found. Add a brand to get started!</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}