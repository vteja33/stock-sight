export interface StockOption {
    label: string;
    value: string;
    name: string;
    symbol: string;
  }
  
  export const fetchStockList = async (): Promise<StockOption[]> => {
    const apiKey = import.meta.env.VITE_FMP_API_KEY;
    const url = `https://financialmodelingprep.com/api/v3/stock/list?apikey=${apiKey}`;
  
    const response = await fetch(url);
    const data = await response.json();
  
    const formatted = data
      .filter((item: any) => item.symbol && item.name)
      .map((item: any) => ({
        label: `${item.symbol} - ${item.name}`,
        value: item.symbol,
        name: item.name,
        symbol: item.symbol,
      }));
  
    return formatted;
  };
  