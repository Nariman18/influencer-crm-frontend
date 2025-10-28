'use client';

import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardApi } from '@/lib/api/services';
import { Users, FileText, Mail, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await dashboardApi.getStats();
      return response.data;
    },
  });

  const statCards = [
    {
      title: 'Total Influencers',
      value: stats?.totalInfluencers || 0,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Active Contracts',
      value: stats?.activeContracts || 0,
      icon: FileText,
      color: 'text-green-600',
    },
    {
      title: 'Emails Sent Today',
      value: stats?.emailsSentToday || 0,
      icon: Mail,
      color: 'text-purple-600',
    },
    {
      title: 'In Pipeline',
      value: stats ? stats.pipelineStats.ping1 + stats.pipelineStats.ping2 + stats.pipelineStats.ping3 : 0,
      icon: TrendingUp,
      color: 'text-primary',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your influencer marketing campaigns
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? '...' : stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pipeline Stats */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Ping 1</p>
                  <p className="text-2xl font-bold">{stats.pipelineStats.ping1}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Ping 2</p>
                  <p className="text-2xl font-bold">{stats.pipelineStats.ping2}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Ping 3</p>
                  <p className="text-2xl font-bold">{stats.pipelineStats.ping3}</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Contract</p>
                  <p className="text-2xl font-bold text-primary">{stats.pipelineStats.contract}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

