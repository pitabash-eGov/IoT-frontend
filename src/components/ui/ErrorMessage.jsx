import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <p className="text-sm text-red-700">{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md bg-red-100 px-4 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
