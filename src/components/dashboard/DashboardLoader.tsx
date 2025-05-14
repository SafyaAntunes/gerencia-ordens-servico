
import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DashboardLoader = () => {
  return (
    <div className="animate-fade-in">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      
      {/* Metrics cards skeleton */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-24 mb-1" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-9 w-12" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Charts skeleton */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-6">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <CardTitle><Skeleton className="h-5 w-48" /></CardTitle>
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Skeleton className="h-[240px] w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Table skeleton */}
      <div className="mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle><Skeleton className="h-5 w-64" /></CardTitle>
            <Skeleton className="h-9 w-24" />
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Skeleton className="h-10 w-64" />
            </div>
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <th key={i} className="h-12 px-4 text-left">
                          <Skeleton className="h-4 w-16" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((row) => (
                      <tr key={row} className="border-b">
                        {[1, 2, 3, 4, 5, 6].map((cell) => (
                          <td key={`${row}-${cell}`} className="p-4">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardLoader;
