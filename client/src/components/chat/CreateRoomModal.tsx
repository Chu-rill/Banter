'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X,
  Hash,
  Video,
  Lock,
  Globe,
  Users,
  AlertCircle,
  Check
} from 'lucide-react';
import { roomApi, Room } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const createRoomSchema = z.object({
  name: z
    .string()
    .min(3, 'Room name must be at least 3 characters')
    .max(50, 'Room name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Room name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z
    .string()
    .max(200, 'Description must be less than 200 characters')
    .optional(),
  type: z.enum(['PUBLIC', 'PRIVATE']),
  mode: z.enum(['CHAT', 'VIDEO', 'BOTH']),
  maxParticipants: z
    .number()
    .min(2, 'Must allow at least 2 participants')
    .max(100, 'Maximum 100 participants allowed'),
});

type CreateRoomFormData = z.infer<typeof createRoomSchema>;

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (room: Room) => void;
}

export default function CreateRoomModal({ isOpen, onClose, onRoomCreated }: CreateRoomModalProps) {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      type: 'PUBLIC',
      mode: 'BOTH',
      maxParticipants: 10,
    },
  });

  const watchType = watch('type');
  const watchMode = watch('mode');

  const onSubmit = async (data: CreateRoomFormData) => {
    try {
      setError('');
      setIsSubmitting(true);
      
      const room = await roomApi.createRoom({
        name: data.name,
        description: data.description,
        type: data.type,
        mode: data.mode,
        maxParticipants: data.maxParticipants,
      });
      
      onRoomCreated(room);
      reset();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create room. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Create New Room</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Room Name */}
          <div className="space-y-2">
            <Input
              {...register('name')}
              label="Room Name"
              placeholder="Enter room name"
              error={errors.name?.message}
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Input
              {...register('description')}
              label="Description (Optional)"
              placeholder="What's this room about?"
              error={errors.description?.message}
              maxLength={200}
            />
          </div>

          {/* Room Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Room Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('type', 'PUBLIC')}
                className={cn(
                  "p-4 border rounded-lg text-left transition-all",
                  watchType === 'PUBLIC'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    watchType === 'PUBLIC'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Public</p>
                    <p className="text-xs text-muted-foreground">Anyone can join</p>
                  </div>
                  {watchType === 'PUBLIC' && (
                    <Check className="w-4 h-4 text-primary ml-auto" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setValue('type', 'PRIVATE')}
                className={cn(
                  "p-4 border rounded-lg text-left transition-all",
                  watchType === 'PRIVATE'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    watchType === 'PRIVATE'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Private</p>
                    <p className="text-xs text-muted-foreground">Invite only</p>
                  </div>
                  {watchType === 'PRIVATE' && (
                    <Check className="w-4 h-4 text-primary ml-auto" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Room Mode */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Room Mode</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setValue('mode', 'CHAT')}
                className={cn(
                  "p-3 border rounded-lg text-center transition-all",
                  watchMode === 'CHAT'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <Hash className={cn(
                  "w-5 h-5 mx-auto mb-1",
                  watchMode === 'CHAT' ? "text-primary" : "text-muted-foreground"
                )} />
                <p className="text-xs font-medium">Chat Only</p>
              </button>

              <button
                type="button"
                onClick={() => setValue('mode', 'VIDEO')}
                className={cn(
                  "p-3 border rounded-lg text-center transition-all",
                  watchMode === 'VIDEO'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <Video className={cn(
                  "w-5 h-5 mx-auto mb-1",
                  watchMode === 'VIDEO' ? "text-primary" : "text-muted-foreground"
                )} />
                <p className="text-xs font-medium">Video Only</p>
              </button>

              <button
                type="button"
                onClick={() => setValue('mode', 'BOTH')}
                className={cn(
                  "p-3 border rounded-lg text-center transition-all",
                  watchMode === 'BOTH'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <Users className={cn(
                  "w-5 h-5 mx-auto mb-1",
                  watchMode === 'BOTH' ? "text-primary" : "text-muted-foreground"
                )} />
                <p className="text-xs font-medium">Both</p>
              </button>
            </div>
          </div>

          {/* Max Participants */}
          <div className="space-y-2">
            <Input
              {...register('maxParticipants', { valueAsNumber: true })}
              type="number"
              label="Max Participants"
              placeholder="10"
              min={2}
              max={100}
              error={errors.maxParticipants?.message}
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of users who can join this room
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Create Room
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
