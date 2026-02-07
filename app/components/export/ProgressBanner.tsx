import { Alert } from '@/app/components/Alert';

interface ProgressBannerProps {
  message: string;
  phase?: string;
}

export function ProgressBanner({ message, phase }: ProgressBannerProps) {
  return (
    <Alert variant="info">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        <div>
          <p className="font-medium">{message}</p>
          {phase && <p className="mt-1 text-sm">{phase}</p>}
        </div>
      </div>
    </Alert>
  );
}
