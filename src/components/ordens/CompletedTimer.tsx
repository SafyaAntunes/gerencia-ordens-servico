
import { formatTime } from "@/utils/timerUtils";

interface CompletedTimerProps {
  totalSavedTime: number;
}

export default function CompletedTimer({ totalSavedTime }: CompletedTimerProps) {
  return (
    <div className="w-full">
      <div className="text-right font-mono text-2xl font-bold">
        {formatTime(totalSavedTime)}
      </div>
    </div>
  );
}
