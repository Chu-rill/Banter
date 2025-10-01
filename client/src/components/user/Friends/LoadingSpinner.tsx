import { Loader2 } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-32">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}
