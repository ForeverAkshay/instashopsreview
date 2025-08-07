import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, User } from "lucide-react";

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

export default function MessagesPage() {
  const { data: messages, isLoading, error } = useQuery<ContactMessage[]>({
    queryKey: ['/api/admin/contact-messages'],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading contact messages...</div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error.message;
    const isUnauthorized = errorMessage.includes('401') || errorMessage.includes('403');
    
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">
          {isUnauthorized ? 
            "Admin access required. Please login with admin credentials." : 
            "Failed to load contact messages. Please try again."
          }
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-8 w-8 text-purple-600" />
        <h1 className="text-3xl font-bold">Contact Messages</h1>
        <Badge variant="secondary" className="ml-auto">
          {messages?.length || 0} messages
        </Badge>
      </div>
      
      {!messages || messages.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No contact messages yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((msg: ContactMessage) => (
            <Card key={msg.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <CardTitle className="text-lg">{msg.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <a 
                    href={`mailto:${msg.email}`} 
                    className="hover:text-purple-600 underline"
                  >
                    {msg.email}
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="whitespace-pre-wrap text-gray-800">{msg.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}