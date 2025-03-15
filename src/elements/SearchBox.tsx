import { Search, X } from "lucide-react";
import { forwardRef } from "react";

interface SearchBoxProps {
  onChange: (value: string) => void;
  onClear?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  value: string;
}

const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>((props, ref) => {
  const { placeholder, value, onChange, onKeyDown, onClear } = props;
  const handleClear = () => {
    onChange("");
    if (onClear) onClear();
  };
  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        strokeWidth={1.5}
      />
      <input
        ref={ref}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck="false"
        autoComplete="false"
        autoCapitalize="false"
        autoCorrect="false"
        className="w-full pl-10 pr-8 p-2 outline-none border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
});

export default SearchBox;
