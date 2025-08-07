import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    logoutMutation.mutate();
    closeMenu();
  };

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href={user ? "/" : "/auth"} className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              InstaShop Review
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {user && (
              <Link href="/">
                <span className={`text-sm ${isActive("/") ? "font-semibold text-purple-600" : "text-gray-600 hover:text-purple-500"}`}>
                  Home
                </span>
              </Link>
            )}
            <Link href="/about">
              <span className={`text-sm ${isActive("/about") ? "font-semibold text-purple-600" : "text-gray-600 hover:text-purple-500"}`}>
                About Us
              </span>
            </Link>
            <Link href="/contact">
              <span className={`text-sm ${isActive("/contact") ? "font-semibold text-purple-600" : "text-gray-600 hover:text-purple-500"}`}>
                Contact
              </span>
            </Link>
            
            {user && user.isAdmin && (
              <>
                <Link href="/admin">
                  <span className={`text-sm ${isActive("/admin") ? "font-semibold text-purple-600" : "text-gray-600 hover:text-purple-500"}`}>
                    Admin Panel
                  </span>
                </Link>
                <Link href="/admin/messages">
                  <span className={`text-sm ${isActive("/admin/messages") ? "font-semibold text-purple-600" : "text-gray-600 hover:text-purple-500"}`}>
                    Messages
                  </span>
                </Link>
              </>
            )}
            
            {user ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout} 
                className="ml-4"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Link href="/auth">
                <Button size="sm">Login</Button>
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t">
            <ul className="space-y-4">
              {user && (
                <li>
                  <Link href="/" onClick={closeMenu}>
                    <span className={`block py-2 ${isActive("/") ? "font-semibold text-purple-600" : "text-gray-600"}`}>
                      Home
                    </span>
                  </Link>
                </li>
              )}
              <li>
                <Link href="/about" onClick={closeMenu}>
                  <span className={`block py-2 ${isActive("/about") ? "font-semibold text-purple-600" : "text-gray-600"}`}>
                    About Us
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/contact" onClick={closeMenu}>
                  <span className={`block py-2 ${isActive("/contact") ? "font-semibold text-purple-600" : "text-gray-600"}`}>
                    Contact
                  </span>
                </Link>
              </li>
              {user && user.isAdmin && (
                <>
                  <li>
                    <Link href="/admin" onClick={closeMenu}>
                      <span className={`block py-2 ${isActive("/admin") ? "font-semibold text-purple-600" : "text-gray-600"}`}>
                        Admin Panel
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/messages" onClick={closeMenu}>
                      <span className={`block py-2 ${isActive("/admin/messages") ? "font-semibold text-purple-600" : "text-gray-600"}`}>
                        Messages
                      </span>
                    </Link>
                  </li>
                </>
              )}
              {user ? (
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center py-2 text-gray-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout ({user.username})
                  </button>
                </li>
              ) : (
                <li>
                  <Link href="/auth" onClick={closeMenu}>
                    <span className="block py-2 text-gray-600">
                      Login / Register
                    </span>
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}