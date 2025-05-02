import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Line } from "react-chartjs-2";
import StockSearch from "@/components/ui/StockSearch";
import { fetchStockList, StockOption } from "@/lib/stockService";

export default function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [days, setDays] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState<any>(null);
  const [stockOptions, setStockOptions] = useState<StockOption[]>([]);

  useEffect(() => {
    const loadStocks = async () => {
      const stocks = await fetchStockList();
      setStockOptions(stocks);
    };
    loadStocks();
  }, []);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://stock-sight-backend.onrender.com/predict?symbol=${ticker}&days=${days}`
      );
      const data = await response.json();
      setStockData(data);
    } catch (error) {
      alert("Failed to fetch prediction");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center mb-8 py-8">
      <div className="flex items-center gap-2 mb-4">
        <img
          src={`${import.meta.env.BASE_URL}stocks.jpg`}
          alt="Logo"
          className="w-8 h-8"
        />
        <h1 className="text-3xl font-bold">Stock Predictor</h1>
      </div>

      <div className="flex flex-wrap justify-center items-end gap-4 mb-8">
        <div className="flex flex-col w-80">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Stock
          </label>
          <StockSearch stockOptions={stockOptions} onSelect={setTicker} />
        </div>

        <div className="flex flex-col w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Days
          </label>
          <Input
            type="number"
            placeholder="Days"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
        </div>

        <Button onClick={handleFetch} disabled={loading} className="h-10">
          {loading ? <Loader2 className="animate-spin" /> : "Predict"}
        </Button>
      </div>

      {stockData && (
        <>
          <div className="bg-gray-100 p-4 rounded-md shadow-md mb-4 w-full max-w-2xl">
            <h2 className="text-xl text-center font-bold mb-2">
              Stock Information
            </h2>
            <p>
              📈 <strong>Current Price:</strong> $
              {stockData.historical_prices.slice(-1)[0].toFixed(2)}
            </p>
            <p>
              🔮{" "}
              <strong>
                Predicted Price after {stockData.predicted_prices.length} days:
              </strong>{" "}
              ${stockData.predicted_prices.slice(-1)[0].toFixed(2)}
            </p>
            <p>
              ❓ <strong>Should you buy this stock:</strong>{" "}
              {stockData.predicted_prices.slice(-1)[0].toFixed(2) -
                stockData.historical_prices.slice(-1)[0].toFixed(2) >
              0 ? (
                <span className="text-green-700">Yes</span>
              ) : (
                <span className="text-red-700">No</span>
              )}
            </p>
            <p>
              📊 <strong>Model Accuracy:</strong>{" "}
              {Math.round(stockData.model_accuracy * 100)}%
            </p>
          </div>

          <div className="w-full max-w-4xl">
            <Line
              key={ticker}
              data={{
                labels: [
                  ...stockData.historical_dates,
                  ...stockData.future_dates,
                ],
                datasets: [
                  {
                    label: "Historical Prices",
                    data: [
                      ...stockData.historical_prices,
                      ...Array(stockData.future_dates.length).fill(null),
                    ],
                    borderColor: "blue",
                    fill: false,
                    tension: 0.3,
                    pointRadius: 1,
                  },
                  {
                    label: "Predicted Prices",
                    data: [
                      ...Array(stockData.historical_dates.length - 1).fill(
                        null
                      ),
                      stockData.historical_prices.slice(-1)[0],
                      ...stockData.predicted_prices,
                    ],
                    borderColor: "orange",
                    borderDash: [7, 2],
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: "top" as const,
                  },
                  title: {
                    display: true,
                    text: `Prediction for ${ticker}`,
                  },
                },
                scales: {
                  x: {
                    ticks: {
                      maxTicksLimit: 8,
                      autoSkip: true,
                      maxRotation: 0,
                      minRotation: 0,
                    },
                    title: {
                      display: true,
                      text: "Date",
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: "Price (USD)",
                    },
                  },
                },
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
