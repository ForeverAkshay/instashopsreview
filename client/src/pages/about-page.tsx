import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">
            About InstaShop Review
          </h1>

          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">A Platform by the People, for the People</h2>
            
            <p className="text-gray-700 mb-6 leading-relaxed">
              Welcome to InstaShop Review – A Platform by the People, for the People.
              Share your honest experiences—good or bad—about shopping from Instagram stores. 
              Your reviews help others make informed decisions and promote safe, trustworthy online shopping.
            </p>

            <p className="text-gray-700 mb-6 leading-relaxed">
              Let's build a supportive community that empowers buyers and uplifts small businesses. 
              Shop smart. Shop together.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Our Mission</h3>
                <p className="text-gray-600">To create transparency in Instagram shopping through authentic user reviews.</p>
              </div>
              
              <div className="bg-pink-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Our Values</h3>
                <p className="text-gray-600">Honesty, community support, and empowering small businesses and consumers alike.</p>
              </div>
              
              <div className="bg-indigo-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Join Us</h3>
                <p className="text-gray-600">Become part of our community by sharing your experiences and helping others.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
            <Link href="/contact">
              <Button>Contact Us</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}