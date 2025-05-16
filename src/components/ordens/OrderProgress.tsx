
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface OrderProgressProps {
  percentComplete: number;
}

export const OrderProgress = ({ percentComplete }: OrderProgressProps) => {
  return (
    <div className="flex flex-col gap-1">
      <Progress value={percentComplete} className="h-2" />
      <div className="text-xs text-muted-foreground text-right">
        {Math.round(percentComplete)}% concluído
      </div>
    </div>
  );
};

export default OrderProgress;
