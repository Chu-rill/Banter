"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { socketService } from "@/lib/socket";

interface MediaState {
  video: boolean;
  audio: boolean;
  screen: boolean;
}

interface CallParticipant {
  userId: string;
  username?: string;
  mediaState: MediaState;
}

interface PeerConnection {
  userId: string;
  connection: RTCPeerConnection;
}

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useCall(roomId: string, isVideoCall: boolean = true) {
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaState, setMediaState] = useState<MediaState>({
    video: isVideoCall,
    audio: true,
    screen: false,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );

  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize local media with optional device ID
  const initializeMedia = useCallback(async (audioDeviceId?: string) => {
    try {
      const constraints: MediaStreamConstraints = {
        video: mediaState.video
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            }
          : false,
        audio: mediaState.audio
          ? {
              deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Ensure audio tracks are enabled
      stream.getAudioTracks().forEach(track => {
        track.enabled = mediaState.audio;
        console.log("Audio track enabled:", track.enabled, track.label);
      });

      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error("Failed to get user media:", error);
      throw error;
    }
  }, [mediaState.video, mediaState.audio]);

  // Create peer connection for a specific user
  const createPeerConnection = useCallback(
    async (userId: string, stream: MediaStream) => {
      const peerConnection = new RTCPeerConnection(rtcConfig);

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        console.log(`Adding ${track.kind} track to peer connection:`, {
          enabled: track.enabled,
          readyState: track.readyState,
          label: track.label
        });
        peerConnection.addTrack(track, stream);
      });

      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        console.log(`Received ${event.track.kind} track from ${userId}:`, {
          enabled: event.track.enabled,
          readyState: event.track.readyState
        });
        const [remoteStream] = event.streams;

        // Handle track ending
        event.track.onended = () => {
          console.warn(`Track ${event.track.kind} ended for ${userId}, removing stream`);
          setRemoteStreams((prev) => {
            const newMap = new Map(prev);
            newMap.delete(userId);
            return newMap;
          });
        };

        setRemoteStreams((prev) => new Map(prev).set(userId, remoteStream));
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.getCallSocket()?.emit("signal", {
            roomId,
            targetUserId: userId,
            type: "ice-candidate",
            payload: event.candidate.toJSON(),
          });
        }
      };

      peerConnectionsRef.current.set(userId, { userId, connection: peerConnection });

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socketService.getCallSocket()?.emit("signal", {
        roomId,
        targetUserId: userId,
        type: "offer",
        payload: offer,
      });

      return peerConnection;
    },
    [roomId]
  );

  // Join call
  const joinCall = useCallback(async () => {
    try {
      const stream = await initializeMedia();
      const socket = socketService.getCallSocket();

      if (!socket) {
        console.error("❌ Call socket not initialized!");
        return;
      }

      if (!socket.connected) {
        console.error("❌ Call socket not connected! Socket state:", {
          connected: socket.connected,
          id: socket.id
        });
        return;
      }

      console.log("✅ Joining call with roomId:", roomId, "mediaState:", mediaState);
      socket.emit("join-call", { roomId, mediaState });
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to join call:", error);
    }
  }, [roomId, mediaState, initializeMedia]);

  // Leave call
  const leaveCall = useCallback(() => {
    const socket = socketService.getCallSocket();
    socket?.emit("leave-call", { roomId });

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach(({ connection }) => {
      connection.close();
    });
    peerConnectionsRef.current.clear();
    setRemoteStreams(new Map());
    setIsConnected(false);
  }, [roomId]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !mediaState.video;
        const newState = { ...mediaState, video: !mediaState.video };
        setMediaState(newState);
        socketService.getCallSocket()?.emit("update-media", {
          roomId,
          mediaState: newState,
        });
      }
    }
  }, [mediaState, roomId]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !mediaState.audio;
        const newState = { ...mediaState, audio: !mediaState.audio };
        setMediaState(newState);
        socketService.getCallSocket()?.emit("update-media", {
          roomId,
          mediaState: newState,
        });
      }
    }
  }, [mediaState, roomId]);

  // Socket event handlers
  useEffect(() => {
    const socket = socketService.getCallSocket();
    if (!socket) {
      console.error("❌ Socket not available in useEffect for roomId:", roomId);
      return;
    }

    console.log("🔧 Setting up socket listeners for roomId:", roomId);

    // Handle errors from server
    socket.on("error", (error) => {
      console.error("❌ Server error:", error);
    });

    // Handle successful join
    socket.on("call-joined", async ({ participants: otherParticipants }) => {
      console.log("✅ Call joined successfully! Existing participants:", otherParticipants);
      setParticipants(otherParticipants);

      // DON'T create offers for existing participants
      // They will send offers to us when they receive "participant-joined"
    });

    // Handle new participant - ONLY the existing users should create offers
    socket.on("participant-joined", async ({ userId, mediaState: peerMediaState }) => {
      console.log("New participant joined:", userId);
      setParticipants((prev) => [...prev, { userId, mediaState: peerMediaState }]);

      // Create offer to the new participant
      const stream = localStreamRef.current;
      if (stream) {
        console.log("Creating offer to new participant:", userId);
        await createPeerConnection(userId, stream);
      }
    });

    // Handle participant leaving
    socket.on("participant-left", ({ userId }) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== userId));

      const peerConnection = peerConnectionsRef.current.get(userId);
      if (peerConnection) {
        peerConnection.connection.close();
        peerConnectionsRef.current.delete(userId);
      }

      setRemoteStreams((prev) => {
        const newStreams = new Map(prev);
        newStreams.delete(userId);
        return newStreams;
      });
    });

    // Handle WebRTC signaling
    socket.on("signal", async ({ fromUserId, type, payload }) => {
      try {
        console.log(`Received ${type} from ${fromUserId}`);
        let peerConnection = peerConnectionsRef.current.get(fromUserId)?.connection;

        if (type === "offer") {
          console.log("Processing offer from", fromUserId);

          // Create new peer connection for incoming offer
          if (!peerConnection) {
            peerConnection = new RTCPeerConnection(rtcConfig);

            const stream = localStreamRef.current;
            if (stream) {
              stream.getTracks().forEach((track) => {
                console.log(`Adding ${track.kind} track to answer peer connection:`, {
                  enabled: track.enabled,
                  readyState: track.readyState,
                  label: track.label
                });
                peerConnection!.addTrack(track, stream);
              });
            }

            peerConnection.ontrack = (event) => {
              console.log(`Received ${event.track.kind} track from ${fromUserId}:`, {
                enabled: event.track.enabled,
                readyState: event.track.readyState
              });
              const [remoteStream] = event.streams;

              // Handle track ending
              event.track.onended = () => {
                console.warn(`Track ${event.track.kind} ended for ${fromUserId}, removing stream`);
                setRemoteStreams((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete(fromUserId);
                  return newMap;
                });
              };

              setRemoteStreams((prev) => new Map(prev).set(fromUserId, remoteStream));
            };

            peerConnection.onicecandidate = (event) => {
              if (event.candidate) {
                socket.emit("signal", {
                  roomId,
                  targetUserId: fromUserId,
                  type: "ice-candidate",
                  payload: event.candidate.toJSON(),
                });
              }
            };

            peerConnectionsRef.current.set(fromUserId, {
              userId: fromUserId,
              connection: peerConnection,
            });
          }

          await peerConnection.setRemoteDescription(new RTCSessionDescription(payload));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          console.log("Sending answer to", fromUserId);
          socket.emit("signal", {
            roomId,
            targetUserId: fromUserId,
            type: "answer",
            payload: answer,
          });
        } else if (type === "answer") {
          console.log("Processing answer from", fromUserId);
          if (!peerConnection) {
            console.error("No peer connection found for answer from", fromUserId);
            return;
          }

          if (peerConnection.signalingState !== "have-local-offer") {
            console.error(
              `Wrong state for answer: ${peerConnection.signalingState}, expected: have-local-offer`
            );
            return;
          }

          await peerConnection.setRemoteDescription(new RTCSessionDescription(payload));
          console.log("Answer processed successfully");
        } else if (type === "ice-candidate") {
          if (!peerConnection) {
            console.warn("Received ICE candidate but no peer connection exists for", fromUserId);
            return;
          }

          await peerConnection.addIceCandidate(new RTCIceCandidate(payload));
        }
      } catch (error) {
        console.error(`Error handling ${type} from ${fromUserId}:`, error);
      }
    });

    // Handle media state updates
    socket.on("media-updated", ({ userId, mediaState: peerMediaState }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.userId === userId ? { ...p, mediaState: peerMediaState } : p))
      );
    });

    return () => {
      console.log("🧹 Cleaning up socket listeners for roomId:", roomId);
      socket.off("error");
      socket.off("call-joined");
      socket.off("participant-joined");
      socket.off("participant-left");
      socket.off("signal");
      socket.off("media-updated");
    };
  }, [roomId, createPeerConnection]);

  // Change audio device
  const changeAudioDevice = useCallback(async (deviceId: string) => {
    if (!localStreamRef.current) return;

    try {
      // Stop the current audio track
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.stop();
      }

      // Get new audio stream with selected device
      const newAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const newAudioTrack = newAudioStream.getAudioTracks()[0];

      // Replace audio track in local stream
      if (audioTrack) {
        localStreamRef.current.removeTrack(audioTrack);
      }
      localStreamRef.current.addTrack(newAudioTrack);

      // Update peer connections with new audio track
      peerConnectionsRef.current.forEach(({ connection }) => {
        const sender = connection.getSenders().find(s => s.track?.kind === 'audio');
        if (sender) {
          sender.replaceTrack(newAudioTrack);
        }
      });

      setLocalStream(localStreamRef.current);
      console.log("Audio device changed to:", deviceId);
    } catch (error) {
      console.error("Failed to change audio device:", error);
    }
  }, []);

  return {
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
  };
}
