import { useState } from "react";
import { Input } from "@/components/ui/input";
import { StockOption } from "@/lib/stockService";

interface StockSearchProps {
  stockOptions: StockOption[];
  onSelect: (symbol: string) => void;
}

export default function StockSearch({ stockOptions, onSelect }: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [filteredStocks, setFilteredStocks] = useState<StockOption[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    const filtered = stockOptions.filter(stock =>
      stock.symbol.toLowerCase().includes(value.toLowerCase()) ||
      stock.name.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 10); // Limit to 10 matches for performance

    setFilteredStocks(filtered);
  };

  const handleSelect = (symbol: string) => {
    setQuery(symbol);
    setFilteredStocks([]);
    onSelect(symbol);
  };

  return (
    <div className="relative w-64">
      <Input
        placeholder="Search Stock (Ticker or Name)"
        value={query}
        onChange={handleChange}
      />
      {filteredStocks.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-200 rounded-md w-full mt-1 max-h-60 overflow-auto">
          {filteredStocks.map((stock) => (
            <li
              key={stock.value}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(stock.symbol)}
            >
              {stock.symbol} - {stock.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
