"use client";

import { useEffect, useRef, useState } from "react";
import { Video, VideoOff, Mic, MicOff, PhoneOff, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCall } from "@/hooks/useCall";
import { Room, User } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import Loader from "@/components/ui/Loader";

interface VideoCallProps {
  room?: Room;
  friend?: User;
  isOpen: boolean;
  onClose: () => void;
  isVideoCall?: boolean;
}

export default function VideoCall({
  room,
  friend,
  isOpen,
  onClose,
  isVideoCall = true,
}: VideoCallProps) {
  const { user } = useAuth();

  // Generate consistent room ID for friend calls
  const getRoomId = () => {
    if (room?.id) return room.id;
    if (friend?.id && user?.id) {
      // Sort IDs alphabetically to ensure both users generate the same room ID
      return [user.id, friend.id].sort().join('-');
    }
    return "";
  };

  const roomId = getRoomId();

  const {
    participants,
    localStream,
    remoteStreams,
    mediaState,
    isConnected,
    joinCall,
    leaveCall,
    toggleVideo,
    toggleAudio,
    changeAudioDevice,
  } = useCall(roomId, isVideoCall);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");

  // Load audio devices
  useEffect(() => {
    const loadAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === "audioinput");
        setAudioDevices(audioInputs);

        // Set current device
        if (localStream) {
          const audioTrack = localStream.getAudioTracks()[0];
          const currentDevice = audioTrack?.getSettings().deviceId;
          if (currentDevice) {
            setSelectedAudioDevice(currentDevice);
          }
        }
      } catch (error) {
        console.error("Failed to load audio devices:", error);
      }
    };

    if (isConnected) {
      loadAudioDevices();
    }
  }, [isConnected, localStream]);

  const handleAudioDeviceChange = async (deviceId: string) => {
    setSelectedAudioDevice(deviceId);
    await changeAudioDevice(deviceId);
    setShowAudioSettings(false);
  };

  // Join call when component opens
  useEffect(() => {
    if (isOpen && roomId) {
      joinCall();
    }

    return () => {
      if (isConnected) {
        leaveCall();
      }
    };
  }, [isOpen, roomId]);

  // Update local video when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Update remote videos when streams change
  useEffect(() => {
    remoteStreams.forEach((stream, userId) => {
      const videoElement = remoteVideoRefs.current.get(userId);
      if (videoElement && stream) {
        console.log(`Setting video srcObject for ${userId}:`, {
          streamId: stream.id,
          active: stream.active,
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length,
        });

        videoElement.srcObject = stream;
        videoElement.volume = 1.0;
        videoElement.muted = false;

        // Log all tracks
        stream.getTracks().forEach((track) => {
          console.log(`${track.kind} track:`, {
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted,
          });
        });

        // Ensure video plays
        videoElement
          .play()
          .catch((err) =>
            console.error(`Error playing video for ${userId}:`, err)
          );
      }
    });
  }, [remoteStreams]);

  const handleEndCall = () => {
    leaveCall();
    onClose();
  };

  if (!isOpen) return null;

  const callName = room?.name || friend?.username || "Call";

  // Audio-only call UI with speaking indicator
  if (!isVideoCall) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900">
        {/* Audio elements for remote streams - hidden debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-20 left-4 z-50 bg-black/80 p-2 rounded text-white text-xs hidden sm:block">
            <div>Remote Streams: {remoteStreams.size}</div>
            {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
              <div key={userId} className="mt-1">
                User: {userId.slice(0, 8)} - Tracks:{" "}
                {stream.getAudioTracks().length}
              </div>
            ))}
          </div>
        )}

        {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
          <audio
            key={userId}
            ref={(el) => {
              if (el && stream) {
                console.log("=== AUDIO SETUP START ===");
                console.log(
                  "Setting audio element srcObject for user:",
                  userId
                );
                console.log("Stream details:", {
                  id: stream.id,
                  active: stream.active,
                  audioTracks: stream.getAudioTracks().length,
                  videoTracks: stream.getVideoTracks().length,
                });

                el.srcObject = stream;
                el.volume = 1.0;
                el.muted = false;

                // Log audio tracks in detail
                stream.getAudioTracks().forEach((track, index) => {
                  console.log(`Audio track ${index} for ${userId}:`, {
                    id: track.id,
                    enabled: track.enabled,
                    readyState: track.readyState,
                    muted: track.muted,
                    label: track.label,
                  });

                  // Listen for track events
                  track.onended = () => {
                    // console.error(`⚠️ Audio track ${index} ended for ${userId}`);
                    console.log("Track state when ended:", {
                      readyState: track.readyState,
                      enabled: track.enabled,
                    });
                  };
                  track.onmute = () =>
                    console.log(`Audio track ${index} muted for ${userId}`);
                  track.onunmute = () =>
                    console.log(`Audio track ${index} unmuted for ${userId}`);
                });

                // Try to play with better error handling
                console.log("Attempting to play audio...");
                const playPromise = el.play();
                if (playPromise !== undefined) {
                  playPromise
                    .then(() => {
                      console.log(`✓ Successfully playing audio for ${userId}`);
                      console.log("Audio element state:", {
                        paused: el.paused,
                        muted: el.muted,
                        volume: el.volume,
                        readyState: el.readyState,
                      });
                    })
                    .catch((err) => {
                      console.error(
                        `✗ Error playing audio for ${userId}:`,
                        err
                      );
                      console.log(
                        "Retrying with user interaction workaround..."
                      );
                      // Try unmuting and playing again
                      el.muted = false;
                      setTimeout(() => {
                        el.play().catch((e) => {
                          console.error("Retry failed:", e);
                          console.log(
                            "Audio element might need user interaction to play"
                          );
                        });
                      }, 100);
                    });
                }
                console.log("=== AUDIO SETUP END ===");
              }
            }}
            autoPlay
            playsInline
            controls={false}
          />
        ))}

        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
              <span className="text-white font-medium text-sm sm:text-base truncate">{callName}</span>
            </div>
            <span className="text-gray-300 text-xs sm:text-sm hidden sm:inline">
              {participants.length + 1} participant
              {participants.length !== 0 ? "s" : ""}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleEndCall}
            className="text-white hover:bg-white/10 flex-shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Participants Grid */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl w-full">
            {/* Local user */}
            <div className="flex flex-col items-center space-y-3 sm:space-y-4">
              <div className="relative">
                {/* Speaking indicator rings */}
                {mediaState.audio && (
                  <>
                    <div className="absolute inset-0 -m-2 sm:-m-3 rounded-full border-3 sm:border-4 border-green-500 animate-ping opacity-75"></div>
                    <div className="absolute inset-0 -m-1 sm:-m-2 rounded-full border-2 sm:border-3 border-green-400 animate-pulse"></div>
                  </>
                )}

                <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-semibold shadow-2xl">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>

                {!mediaState.audio && (
                  <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                )}
              </div>
              <span className="text-white text-base sm:text-lg font-medium">You</span>
            </div>

            {/* Remote participants */}
            {participants.map((participant) => (
              <div
                key={participant.userId}
                className="flex flex-col items-center space-y-3 sm:space-y-4"
              >
                <div className="relative">
                  {/* Speaking indicator rings */}
                  {participant.mediaState.audio && (
                    <>
                      <div className="absolute inset-0 -m-2 sm:-m-3 rounded-full border-3 sm:border-4 border-blue-500 animate-ping opacity-75"></div>
                      <div className="absolute inset-0 -m-1 sm:-m-2 rounded-full border-2 sm:border-3 border-blue-400 animate-pulse"></div>
                    </>
                  )}

                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-semibold shadow-2xl">
                    {participant.username?.[0]?.toUpperCase() || "U"}
                  </div>

                  {!participant.mediaState.audio && (
                    <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                      <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  )}
                </div>
                <span className="text-white text-base sm:text-lg font-medium truncate max-w-[150px]">
                  {participant.username ||
                    `User ${participant.userId.slice(0, 8)}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2">
          <div className="relative flex items-center justify-center space-x-3 sm:space-x-4">
            <button
              onClick={toggleAudio}
              className={cn(
                "flex items-center justify-center rounded-full w-12 h-12 sm:w-14 sm:h-14 transition-colors shadow-xl",
                mediaState.audio
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              )}
            >
              {mediaState.audio ? (
                <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>

            <button
              onClick={handleEndCall}
              className="rounded-full w-14 h-14 sm:w-16 sm:h-16 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl transition-colors"
            >
              <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>

            <button
              onClick={() => setShowAudioSettings(!showAudioSettings)}
              className="flex items-center justify-center rounded-full w-12 h-12 sm:w-14 sm:h-14 bg-gray-700 hover:bg-gray-600 text-white transition-colors shadow-xl"
            >
              <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Audio Device Selector */}
            {showAudioSettings && (
              <div className="absolute bottom-full mb-4 right-0 bg-gray-800 rounded-lg shadow-2xl p-4 min-w-[250px]">
                <h4 className="text-white font-medium mb-3 text-sm">Audio Input</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {audioDevices.map((device) => (
                    <button
                      key={device.deviceId}
                      onClick={() => handleAudioDeviceChange(device.deviceId)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded text-sm transition-colors",
                        selectedAudioDevice === device.deviceId
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                      )}
                    >
                      {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader size={100} color="#9b6bff" />
              <p className="text-white">Connecting to call...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Video call UI
  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-white font-medium text-sm sm:text-base truncate">{callName}</span>
          </div>
          <span className="text-gray-300 text-xs sm:text-sm hidden sm:inline">
            {participants.length + 1} participant
            {participants.length !== 0 ? "s" : ""}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleEndCall}
          className="text-white hover:bg-white/10 flex-shrink-0"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-2 sm:p-4 h-[calc(100vh-140px)] sm:h-[calc(100vh-200px)]">
        <div
          className={`grid gap-2 sm:gap-4 h-full ${
            participants.length === 0
              ? "grid-cols-1"
              : participants.length === 1
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 sm:grid-rows-2"
          }`}
        >
          {/* Local Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {!mediaState.video && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-semibold">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
              </div>
            )}

            <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-0.5 sm:rounded-lg sm:px-3 sm:py-1">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="text-white text-xs sm:text-sm font-medium">You</span>
                {!mediaState.audio && (
                  <MicOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400" />
                )}
              </div>
            </div>
          </div>

          {/* Remote Videos */}
          {participants.map((participant) => (
            <div
              key={participant.userId}
              className="relative bg-gray-800 rounded-lg overflow-hidden"
            >
              <video
                ref={(el) => {
                  if (el) remoteVideoRefs.current.set(participant.userId, el);
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {!participant.mediaState.video && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-semibold">
                    {participant.username?.[0]?.toUpperCase() || "U"}
                  </div>
                </div>
              )}

              <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-0.5 sm:rounded-lg sm:px-3 sm:py-1">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="text-white text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-none">
                    {participant.username ||
                      `User ${participant.userId.slice(0, 8)}`}
                  </span>
                  {!participant.mediaState.audio && (
                    <MicOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 sm:p-6 bg-black/20 backdrop-blur-sm">
        <div className="relative flex items-center justify-center space-x-3 sm:space-x-4">
          <button
            onClick={toggleAudio}
            className={cn(
              "rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-colors shadow-lg",
              mediaState.audio
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            )}
          >
            {mediaState.audio ? (
              <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>

          {isVideoCall && (
            <button
              onClick={toggleVideo}
              className={cn(
                "rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-colors shadow-lg",
                mediaState.video
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              )}
            >
              {mediaState.video ? (
                <Video className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          )}

          <button
            onClick={handleEndCall}
            className="rounded-full w-14 h-14 sm:w-16 sm:h-16 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-colors"
          >
            <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          <button
            onClick={() => setShowAudioSettings(!showAudioSettings)}
            className="flex items-center justify-center rounded-full w-12 h-12 sm:w-14 sm:h-14 bg-gray-700 hover:bg-gray-600 text-white transition-colors shadow-lg"
          >
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Audio Device Selector */}
          {showAudioSettings && (
            <div className="absolute bottom-full mb-4 right-0 bg-gray-800 rounded-lg shadow-2xl p-4 min-w-[250px]">
              <h4 className="text-white font-medium mb-3 text-sm">Audio Input</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {audioDevices.map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => handleAudioDeviceChange(device.deviceId)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded text-sm transition-colors",
                      selectedAudioDevice === device.deviceId
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    )}
                  >
                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader size={100} color="#9b6bff" />
            <p className="text-white">Connecting to call...</p>
          </div>
        </div>
      )}
    </div>
  );
}
