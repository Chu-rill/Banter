// Proper TypeScript interface
interface CharacterCounterProps {
  current: number;
  max?: number;
  showCountAt?: number;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  current,
  max = 100,
  showCountAt = 0.8,
}) => {
  const percentage = current / max;
  const remaining = max - current;
  const circumference = 2 * Math.PI * 9; // radius = 9

  const getColor = (): string => {
    if (current >= max) return "stroke-red-500";
    if (percentage > 0.9) return "stroke-yellow-500";
    if (percentage > 0.8) return "stroke-blue-500";
    return "stroke-gray-400";
  };

  return (
    <div className="flex items-center justify-end ">
      <div className="flex items-center gap-2">
        <div className="relative">
          <svg
            width="30"
            height="30"
            viewBox="0 0 20 20"
            className="transform -rotate-90"
          >
            <circle
              cx="10"
              cy="10"
              r="9"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            <circle
              cx="10"
              cy="10"
              r="9"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              className={`transition-all duration-200 ${getColor()}`}
              strokeDasharray={circumference}
              strokeDashoffset={circumference - percentage * circumference}
            />
          </svg>

          {percentage > 0.95 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`text-[10px] font-bold ${
                  current >= max ? "text-red-600" : "text-gray-700"
                }`}
              >
                {remaining}
              </span>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[10px] font-bold text-blue-500`}>
                {remaining}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
