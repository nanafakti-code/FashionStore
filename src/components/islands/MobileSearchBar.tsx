import { useState } from "preact/hooks";
import type { JSX } from "preact";

export default function MobileSearchBar() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/productos?q=${encodeURIComponent(searchTerm)}`;
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e as any);
    }
  };

  return (
    <form onSubmit={handleSearch} className="md:hidden px-4 py-3 bg-gray-50 border-t border-gray-200">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Busca productos..."
          value={searchTerm}
          onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#00aa45] text-sm"
        />
        <button
          type="submit"
          className="bg-[#00aa45] text-white px-4 py-2 rounded-lg hover:bg-[#009340] font-bold transition text-sm"
        >
          🔍
        </button>
      </div>
    </form>
  );
}
