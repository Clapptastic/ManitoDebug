import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface MarketData {
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  high52w?: number;
  low52w?: number;
  priceHistory?: Array<{ date: string; price: number; volume: number }>;
}

interface StockChartProps {
  data: MarketData;
  ticker: string;
}

const StockChart: React.FC<StockChartProps> = ({ data, ticker }) => {
  // Generate sample price history if not provided
  const priceHistory = data.priceHistory || generateSamplePriceHistory(data.price, 30);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatVolume = (value: number) => {
    if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
    return value.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const currentPrice = data.price;
  const isPositive = data.changePercent >= 0;

  return (
    <div className="space-y-6">
      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {ticker} Price Chart
            </div>
            <div className={`text-right ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              <div className="text-lg font-bold">{formatPrice(currentPrice)}</div>
              <div className="text-sm">
                {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={formatPrice}
                  domain={['dataMin - 5', 'dataMax + 5']}
                  className="text-xs"
                />
                <Tooltip 
                  labelFormatter={(value) => `Date: ${formatDate(value)}`}
                  formatter={(value: number) => [formatPrice(value), 'Price']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: isPositive ? '#10b981' : '#ef4444', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Trading Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={formatVolume}
                  className="text-xs"
                />
                <Tooltip 
                  labelFormatter={(value) => `Date: ${formatDate(value)}`}
                  formatter={(value: number) => [formatVolume(value), 'Volume']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="volume" 
                  fill="hsl(var(--primary))"
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.high52w && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">52W High</p>
                <p className="text-lg font-bold text-emerald-600">{formatPrice(data.high52w)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {data.low52w && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">52W Low</p>
                <p className="text-lg font-bold text-red-600">{formatPrice(data.low52w)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Avg Volume</p>
              <p className="text-lg font-bold">{formatVolume(data.volume)}</p>
            </div>
          </CardContent>
        </Card>

        {data.pe && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">P/E Ratio</p>
                <p className="text-lg font-bold">{data.pe.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Generate sample price history for demo purposes
function generateSamplePriceHistory(currentPrice: number, days: number) {
  const history = [];
  const startPrice = currentPrice * (0.9 + Math.random() * 0.2);
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Generate realistic price movement
    const dailyChange = (Math.random() - 0.5) * 0.1; // ±5% daily change
    const price = i === 0 ? currentPrice : 
                  startPrice * (1 + dailyChange * (days - i) / days);
    
    const volume = Math.floor((500000 + Math.random() * 2000000) * 
                             (0.5 + Math.random()));
    
    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100,
      volume: volume
    });
  }
  
  return history;
}

export default StockChart;