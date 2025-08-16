import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { UserGrowthData, RevenueData, ConversionData, WebsiteAnalytics } from "@/types/analytics";

const Analytics = () => {
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [conversionData, setConversionData] = useState<ConversionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        // Since website_analytics table doesn't exist, use mock data
        const mockAnalyticsData: WebsiteAnalytics[] = [
          { unique_visitors: 150, pageviews: 320, date: '2024-01-01' },
          { unique_visitors: 180, pageviews: 410, date: '2024-01-08' },
          { unique_visitors: 220, pageviews: 485, date: '2024-01-15' },
          { unique_visitors: 195, pageviews: 380, date: '2024-01-22' },
          { unique_visitors: 240, pageviews: 520, date: '2024-01-29' }
        ];

        // Transform data for charts
        const transformedUserGrowth = mockAnalyticsData.map((item, index) => ({
          name: `Week ${index + 1}`,
          users: item.unique_visitors || 0
        }));

        const transformedRevenue = mockAnalyticsData.map((item, index) => ({
          name: `Week ${index + 1}`,
          revenue: item.pageviews * 2.5 || 0 // Simple revenue calculation
        }));

        const transformedConversion = [
          { name: 'Landing', value: mockAnalyticsData[0]?.pageviews || 0 },
          { name: 'Signup', value: Math.floor((mockAnalyticsData[0]?.pageviews || 0) * 0.8) },
          { name: 'Trial', value: Math.floor((mockAnalyticsData[0]?.pageviews || 0) * 0.4) },
          { name: 'Paid', value: Math.floor((mockAnalyticsData[0]?.pageviews || 0) * 0.2) },
        ];

        setUserGrowthData(transformedUserGrowth);
        setRevenueData(transformedRevenue);
        setConversionData(transformedConversion);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </section>
    );
  }
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Startup Analytics Dashboard
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="value" 
                      fill="#6366f1" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Analytics;