import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ fullScreen = false }) {
  const spinner = <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;

  if (fullScreen) {
    return (
      <div className="flex h-screen items-center justify-center">{spinner}</div>
    );
  }

  return <div className="flex items-center justify-center py-12">{spinner}</div>;
}
