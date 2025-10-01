import { AlertCircle, X } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onClose: () => void;
}

export default function ErrorBanner({ message, onClose }: ErrorBannerProps) {
  return (
    <div className="bg-red-100 text-red-700 p-2 rounded flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} />
        {message}
      </div>
      <button onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}
