import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

export default function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder,
}: SearchInputProps) {
  return (
    <div className=" w-full flex justify-between gap-2">
      <div className=" w-full ml-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
      </div>
      <button
        onClick={onSearch}
        className="p-2 rounded-md bg-orange-400 hover:bg-orange-500 hover:cursor-pointer"
      >
        <Search size={20} />
      </button>
    </div>
  );
}
