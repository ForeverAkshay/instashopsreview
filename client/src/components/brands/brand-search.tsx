import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState, FormEvent } from "react";

export default function BrandSearch({
  onSearch,
}: {
  onSearch: (query: string) => void;
}) {
  const [searchValue, setSearchValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  // Also handle input changes for immediate feedback
  const handleInputChange = (value: string) => {
    setSearchValue(value);
    
    // If input is cleared, reset search
    if (value === "") {
      onSearch("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          className="pl-10"
          placeholder="Search brands by name or Instagram handle..."
          value={searchValue}
          onChange={(e) => handleInputChange(e.target.value)}
        />
      </div>
      <Button type="submit">
        Search
      </Button>
    </form>
  );
}
