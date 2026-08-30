export function LoadingSpinner({ message = 'Loading-' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-3 border-gray-200 border-t-red-600 rounded-full animate-spin" />
      <span className="text-[13px] text-gray-400 font-medium">{message}</span>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <span className="text-red-500 text-xl">!</span>
      </div>
      <p className="text-[13px] text-gray-600 text-center max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 text-[13px] font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'No data to display', icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <Icon className="w-6 h-6 text-gray-400" />
        </div>
      )}
      <p className="text-[13px] text-gray-400 text-center max-w-md">{message}</p>
    </div>
  );
}
