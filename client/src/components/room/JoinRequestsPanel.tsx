"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { LoadingCard, InlineLoading } from "@/components/ui/LoadingSpinner";
import { Check, X, UserCircle, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { roomApi } from "@/lib/api/roomApi";
import { JoinRequest } from "@/types";

interface JoinRequestsPanelProps {
  roomId: string;
  onClose?: () => void;
}

export default function JoinRequestsPanel({
  roomId,
  onClose,
}: JoinRequestsPanelProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    loadJoinRequests();
  }, [roomId]);

  const loadJoinRequests = async () => {
    try {
      setLoading(true);
      const data = await roomApi.loadJoinRequests(roomId);

      setRequests(data?.data || []);
    } catch (error) {
      console.error("Failed to load join requests:", error);
      toast.error("Failed to load join requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      await roomApi.approveJoinRequest(requestId);
      toast.success("Join request approved");
      setRequests(requests.filter((r) => r.id !== requestId));
    } catch (error: any) {
      console.error("Failed to approve request:", error);
      toast.error(error.response?.data?.message || "Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      await roomApi.denyJoinRequest(requestId);
      toast.success("Join request denied");
      setRequests(requests.filter((r) => r.id !== requestId));
    } catch (error: any) {
      console.error("Failed to deny request:", error);
      toast.error(error.response?.data?.message || "Failed to deny request");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingCard text="Loading join requests..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Join Requests</h3>
          <p className="text-sm text-muted-foreground">
            {requests.length} pending request{requests.length !== 1 ? "s" : ""}
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <UserCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No pending join requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {imageError || !request.user.avatar ? (
                  <UserIcon className="w-5 h-5" />
                ) : (
                  <img
                    src={request.user.avatar}
                    alt={request.user.username}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={() => setImageError(true)}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {request.user.username}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {request.user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {processingId === request.id ? (
                  <InlineLoading />
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request.id)}
                      className="bg-green-600 hover:bg-green-700 text-white hover:cursor-pointer"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white hover:cursor-pointer"
                      onClick={() => handleDeny(request.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Deny
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
