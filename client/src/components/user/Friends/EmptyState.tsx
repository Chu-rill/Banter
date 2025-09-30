interface EmptyStateProps {
  icon: React.ElementType;
  message: string;
}

export default function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-gray-500 py-10">
      <Icon size={32} className="mb-2" />
      <p>{message}</p>
    </div>
  );
}
