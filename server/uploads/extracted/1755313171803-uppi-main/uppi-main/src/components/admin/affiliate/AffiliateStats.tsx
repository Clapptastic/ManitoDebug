import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, MousePointer, TrendingUp, Link } from 'lucide-react';

interface AffiliateStatsProps {
  totalLinks: number;
  activeLinks: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  conversionRate: number;
}

const AffiliateStats: React.FC<AffiliateStatsProps> = ({
  totalLinks,
  activeLinks,
  totalClicks,
  totalConversions,
  totalRevenue,
  conversionRate
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Links</CardTitle>
          <Link className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(totalLinks ?? 0)}</div>
          <p className="text-xs text-muted-foreground">
            {(activeLinks ?? 0)} active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          <MousePointer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(totalClicks ?? 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            All time clicks
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversions</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(totalConversions ?? 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {(conversionRate ?? 0).toFixed(1)}% conversion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(totalRevenue ?? 0).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Lifetime earnings
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliateStats;