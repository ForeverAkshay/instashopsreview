import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Brand } from "@shared/schema";

type PendingBrand = Brand & { categoryName?: string };

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending brands
  const { data: pendingBrands, isLoading } = useQuery<PendingBrand[]>({
    queryKey: ["/api/admin/brands/pending"],
  });

  // Mutation for updating brand status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ brandId, status }: { brandId: number; status: "approved" | "rejected" }) => {
      const response = await fetch(`/api/admin/brands/${brandId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update brand status: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brands/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({
        title: "Brand Updated",
        description: `Brand has been ${status}`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update brand status",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (brandId: number) => {
    updateStatusMutation.mutate({ brandId, status: "approved" });
  };

  const handleReject = (brandId: number) => {
    updateStatusMutation.mutate({ brandId, status: "rejected" });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-2">Review and approve brand submissions</p>
      </div>

      {!pendingBrands || pendingBrands.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-500">No pending brand submissions to review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">
              {pendingBrands.length} brand{pendingBrands.length !== 1 ? 's' : ''} pending approval
            </span>
          </div>

          {pendingBrands.map((brand) => (
            <Card key={brand.id} className="border-l-4 border-l-orange-400">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{brand.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">@{brand.instagramHandle}</Badge>
                      {brand.categoryName && (
                        <Badge variant="outline">{brand.categoryName}</Badge>
                      )}
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                        Pending
                      </Badge>
                    </div>
                    <CardDescription>
                      Submitted on {new Date(brand.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  
                  {brand.logoUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={brand.logoUrl}
                        alt={`${brand.name} logo`}
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {brand.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                      <p className="text-gray-600 text-sm">{brand.description}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Instagram: </span>
                      <a
                        href={`https://instagram.com/${brand.instagramHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 text-sm inline-flex items-center gap-1"
                      >
                        @{brand.instagramHandle}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {brand.websiteUrl && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Website: </span>
                        <a
                          href={brand.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 text-sm inline-flex items-center gap-1"
                        >
                          Visit Site
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => handleApprove(brand.id)}
                      disabled={updateStatusMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(brand.id)}
                      disabled={updateStatusMutation.isPending}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}