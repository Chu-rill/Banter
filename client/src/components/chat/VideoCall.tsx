// "use client";

// import { useState, useEffect, useRef, useCallback } from "react";
// import {
//   Video,
//   VideoOff,
//   Mic,
//   MicOff,
//   PhoneOff,
//   Monitor,
//   MonitorOff,
//   Volume2,
//   VolumeX,
//   Settings,
//   Users,
//   Maximize,
//   Minimize,
//   Copy,
//   Phone,
// } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { callApi } from "@/lib/api";
// import { socketService } from "@/lib/socket";
// import { Button } from "@/components/ui/Button";
// import { cn } from "@/lib/utils";
// import { Room } from "@/types";

// interface VideoCallProps {
//   room: Room;
//   isOpen: boolean;
//   onClose: () => void;
//   isVideoCall?: boolean;
// }

// interface CallParticipant {
//   userId: string;
//   username: string;
//   avatar?: string;
//   mediaState: {
//     video: boolean;
//     audio: boolean;
//     screen: boolean;
//   };
//   stream?: MediaStream;
//   isHost?: boolean;
// }

// interface PeerConnection {
//   userId: string;
//   connection: RTCPeerConnection;
//   stream?: MediaStream;
// }

// const rtcConfig: RTCConfiguration = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" },
//     { urls: "stun:stun1.l.google.com:19302" },
//   ],
// };

// export default function VideoCall({
//   room,
//   isOpen,
//   onClose,
//   isVideoCall = true,
// }: VideoCallProps) {
//   const { user } = useAuth();
//   const [participants, setParticipants] = useState<CallParticipant[]>([]);
//   const [localStream, setLocalStream] = useState<MediaStream | null>(null);
//   const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
//   const [isConnecting, setIsConnecting] = useState(false);
//   const [mediaState, setMediaState] = useState({
//     video: isVideoCall,
//     audio: true,
//     screen: false,
//   });
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [showSettings, setShowSettings] = useState(false);
//   const [callDuration, setCallDuration] = useState(0);
//   const [connectionStatus, setConnectionStatus] = useState<
//     "connecting" | "connected" | "failed"
//   >("connecting");

//   const localVideoRef = useRef<HTMLVideoElement>(null);
//   const screenShareRef = useRef<HTMLVideoElement>(null);
//   const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
//   const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
//   const callStartTimeRef = useRef<number>(Date.now());
//   const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

//   // Initialize call when component opens
//   useEffect(() => {
//     if (isOpen) {
//       initializeCall();
//       setupSocketListeners();
//       startDurationTimer();
//     } else {
//       cleanup();
//     }

//     return () => {
//       cleanup();
//     };
//   }, [isOpen]);

//   // Update call duration
//   const startDurationTimer = () => {
//     callStartTimeRef.current = Date.now();
//     durationIntervalRef.current = setInterval(() => {
//       const duration = Math.floor(
//         (Date.now() - callStartTimeRef.current) / 1000
//       );
//       setCallDuration(duration);
//     }, 1000);
//   };

//   const formatCallDuration = (seconds: number) => {
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const secs = seconds % 60;

//     if (hours > 0) {
//       return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
//         .toString()
//         .padStart(2, "0")}`;
//     }
//     return `${minutes}:${secs.toString().padStart(2, "0")}`;
//   };

//   const initializeCall = async () => {
//     try {
//       setIsConnecting(true);
//       setConnectionStatus("connecting");

//       // Get user media
//       const stream = await getUserMedia();
//       setLocalStream(stream);

//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = stream;
//       }

//       // Join call via socket
//       socketService.joinCall(room.id, mediaState);
//       setConnectionStatus("connected");
//     } catch (error) {
//       console.error("Failed to initialize call:", error);
//       setConnectionStatus("failed");
//     } finally {
//       setIsConnecting(false);
//     }
//   };

//   const getUserMedia = async (): Promise<MediaStream> => {
//     const constraints: MediaStreamConstraints = {
//       video: mediaState.video
//         ? {
//             width: { ideal: 1280, max: 1920 },
//             height: { ideal: 720, max: 1080 },
//             frameRate: { ideal: 30, max: 60 },
//           }
//         : false,
//       audio: {
//         echoCancellation: true,
//         noiseSuppression: true,
//         sampleRate: 44100,
//       },
//     };

//     return navigator.mediaDevices.getUserMedia(constraints);
//   };

//   const setupSocketListeners = () => {
//     socketService.on("user-joined-call", handleUserJoined);
//     socketService.on("user-left-call", handleUserLeft);
//     socketService.on("webrtc-offer", handleWebRTCOffer);
//     socketService.on("webrtc-answer", handleWebRTCAnswer);
//     socketService.on("webrtc-ice-candidate", handleWebRTCIceCandidate);
//     socketService.on("media-state-changed", handleMediaStateChanged);
//     socketService.on("call-ended", handleCallEnded);
//     socketService.on("screen-share-started", handleScreenShareStarted);
//     socketService.on("screen-share-stopped", handleScreenShareStopped);
//   };

//   const handleUserJoined = (data: any) => {
//     console.log("User joined call:", data);
//     setParticipants((prev) => {
//       const existing = prev.find((p) => p.userId === data.userId);
//       if (existing) return prev;

//       return [
//         ...prev,
//         {
//           userId: data.userId,
//           username: data.username || `User ${data.userId}`,
//           mediaState: data.mediaState || {
//             video: false,
//             audio: false,
//             screen: false,
//           },
//           isHost: data.isHost || false,
//         },
//       ];
//     });

//     // Create peer connection for new user
//     createPeerConnection(data.userId);
//   };

//   const handleUserLeft = (data: any) => {
//     console.log("User left call:", data);
//     setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));

//     // Clean up peer connection
//     const peerConnection = peerConnectionsRef.current.get(data.userId);
//     if (peerConnection) {
//       peerConnection.connection.close();
//       peerConnectionsRef.current.delete(data.userId);
//     }

//     remoteVideosRef.current.delete(data.userId);
//   };

//   const createPeerConnection = async (userId: string) => {
//     try {
//       const peerConnection = new RTCPeerConnection(rtcConfig);

//       // Add local stream to peer connection
//       if (localStream) {
//         localStream.getTracks().forEach((track) => {
//           peerConnection.addTrack(track, localStream);
//         });
//       }

//       // Handle incoming stream
//       peerConnection.ontrack = (event) => {
//         const [remoteStream] = event.streams;
//         const videoElement = remoteVideosRef.current.get(userId);
//         if (videoElement && remoteStream) {
//           videoElement.srcObject = remoteStream;
//         }

//         // Update participant with stream
//         setParticipants((prev) =>
//           prev.map((p) =>
//             p.userId === userId ? { ...p, stream: remoteStream } : p
//           )
//         );
//       };

//       // Handle ICE candidates
//       peerConnection.onicecandidate = (event) => {
//         if (event.candidate) {
//           socketService.sendWebRTCIceCandidate(
//             room.id,
//             userId,
//             event.candidate.toJSON()
//           );
//         }
//       };

//       // Monitor connection state
//       peerConnection.onconnectionstatechange = () => {
//         console.log(
//           `Peer connection with ${userId}:`,
//           peerConnection.connectionState
//         );
//       };

//       peerConnectionsRef.current.set(userId, {
//         userId,
//         connection: peerConnection,
//       });

//       // Create and send offer
//       const offer = await peerConnection.createOffer();
//       await peerConnection.setLocalDescription(offer);
//       socketService.sendWebRTCOffer(room.id, userId, offer);
//     } catch (error) {
//       console.error("Failed to create peer connection:", error);
//     }
//   };

//   const handleWebRTCOffer = async (data: any) => {
//     try {
//       const { callerId, offer } = data;
//       const peerConnection = new RTCPeerConnection(rtcConfig);

//       // Add local stream
//       if (localStream) {
//         localStream.getTracks().forEach((track) => {
//           peerConnection.addTrack(track, localStream);
//         });
//       }

//       // Handle incoming stream
//       peerConnection.ontrack = (event) => {
//         const [remoteStream] = event.streams;
//         const videoElement = remoteVideosRef.current.get(callerId);
//         if (videoElement && remoteStream) {
//           videoElement.srcObject = remoteStream;
//         }
//       };

//       // Handle ICE candidates
//       peerConnection.onicecandidate = (event) => {
//         if (event.candidate) {
//           socketService.sendWebRTCIceCandidate(
//             room.id,
//             callerId,
//             event.candidate.toJSON()
//           );
//         }
//       };

//       await peerConnection.setRemoteDescription(
//         new RTCSessionDescription(offer)
//       );
//       const answer = await peerConnection.createAnswer();
//       await peerConnection.setLocalDescription(answer);

//       peerConnectionsRef.current.set(callerId, {
//         userId: callerId,
//         connection: peerConnection,
//       });

//       socketService.sendWebRTCAnswer(room.id, callerId, answer);
//     } catch (error) {
//       console.error("Failed to handle WebRTC offer:", error);
//     }
//   };

//   const handleWebRTCAnswer = async (data: any) => {
//     try {
//       const { answererId, answer } = data;
//       const peerConnection = peerConnectionsRef.current.get(answererId);
//       if (peerConnection) {
//         await peerConnection.connection.setRemoteDescription(
//           new RTCSessionDescription(answer)
//         );
//       }
//     } catch (error) {
//       console.error("Failed to handle WebRTC answer:", error);
//     }
//   };

//   const handleWebRTCIceCandidate = async (data: any) => {
//     try {
//       const { senderId, candidate } = data;
//       const peerConnection = peerConnectionsRef.current.get(senderId);
//       if (peerConnection && candidate) {
//         await peerConnection.connection.addIceCandidate(
//           new RTCIceCandidate(candidate)
//         );
//       }
//     } catch (error) {
//       console.error("Failed to handle ICE candidate:", error);
//     }
//   };

//   const handleMediaStateChanged = (data: any) => {
//     setParticipants((prev) =>
//       prev.map((p) =>
//         p.userId === data.userId ? { ...p, mediaState: data.mediaState } : p
//       )
//     );
//   };

//   const handleCallEnded = (data: any) => {
//     console.log("Call ended:", data);
//     onClose();
//   };

//   const handleScreenShareStarted = (data: any) => {
//     console.log("Screen share started by:", data.userId);
//   };

//   const handleScreenShareStopped = (data: any) => {
//     console.log("Screen share stopped by:", data.userId);
//   };

//   const toggleVideo = async () => {
//     if (localStream) {
//       const videoTrack = localStream.getVideoTracks()[0];
//       if (videoTrack) {
//         videoTrack.enabled = !mediaState.video;
//         const newMediaState = { ...mediaState, video: !mediaState.video };
//         setMediaState(newMediaState);
//         socketService.updateMediaState(room.id, newMediaState);
//       }
//     }
//   };

//   const toggleAudio = async () => {
//     if (localStream) {
//       const audioTrack = localStream.getAudioTracks()[0];
//       if (audioTrack) {
//         audioTrack.enabled = !mediaState.audio;
//         const newMediaState = { ...mediaState, audio: !mediaState.audio };
//         setMediaState(newMediaState);
//         socketService.updateMediaState(room.id, newMediaState);
//       }
//     }
//   };

//   const toggleScreenShare = async () => {
//     try {
//       if (mediaState.screen) {
//         // Stop screen sharing
//         if (screenStream) {
//           screenStream.getTracks().forEach((track) => track.stop());
//           setScreenStream(null);
//         }

//         const newMediaState = { ...mediaState, screen: false };
//         setMediaState(newMediaState);
//         socketService.stopScreenShare(room.id);
//         socketService.updateMediaState(room.id, newMediaState);
//       } else {
//         // Start screen sharing
//         const stream = await navigator.mediaDevices.getDisplayMedia({
//           video: true,
//           audio: true,
//         });

//         setScreenStream(stream);
//         if (screenShareRef.current) {
//           screenShareRef.current.srcObject = stream;
//         }

//         const newMediaState = { ...mediaState, screen: true };
//         setMediaState(newMediaState);
//         socketService.startScreenShare(room.id);
//         socketService.updateMediaState(room.id, newMediaState);

//         // Handle screen share ending
//         stream.getVideoTracks()[0].onended = () => {
//           toggleScreenShare();
//         };
//       }
//     } catch (error) {
//       console.error("Screen share error:", error);
//     }
//   };

//   const endCall = async () => {
//     try {
//       // End call for everyone if host, otherwise just leave
//       const isHost = participants.length === 0; // First user is typically host
//       if (isHost) {
//         socketService.endCall(room.id);
//       } else {
//         socketService.leaveCall(room.id);
//       }

//       // Track call duration
//       const duration = Math.floor(
//         (Date.now() - callStartTimeRef.current) / 1000
//       );
//       await callApi.endCall("call-session-id", duration);
//     } catch (error) {
//       console.error("Error ending call:", error);
//     }

//     onClose();
//   };

//   const cleanup = () => {
//     // Stop all media streams
//     if (localStream) {
//       localStream.getTracks().forEach((track) => track.stop());
//       setLocalStream(null);
//     }

//     if (screenStream) {
//       screenStream.getTracks().forEach((track) => track.stop());
//       setScreenStream(null);
//     }

//     // Close all peer connections
//     peerConnectionsRef.current.forEach((peerConnection) => {
//       peerConnection.connection.close();
//     });
//     peerConnectionsRef.current.clear();

//     // Clear duration timer
//     if (durationIntervalRef.current) {
//       clearInterval(durationIntervalRef.current);
//       durationIntervalRef.current = null;
//     }

//     // Remove socket listeners
//     socketService.off("user-joined-call", handleUserJoined);
//     socketService.off("user-left-call", handleUserLeft);
//     socketService.off("webrtc-offer", handleWebRTCOffer);
//     socketService.off("webrtc-answer", handleWebRTCAnswer);
//     socketService.off("webrtc-ice-candidate", handleWebRTCIceCandidate);
//     socketService.off("media-state-changed", handleMediaStateChanged);
//     socketService.off("call-ended", handleCallEnded);
//     socketService.off("screen-share-started", handleScreenShareStarted);
//     socketService.off("screen-share-stopped", handleScreenShareStopped);
//   };

//   const renderParticipantVideo = (participant: CallParticipant) => (
//     <div
//       key={participant.userId}
//       className="relative bg-gray-900 rounded-lg overflow-hidden"
//     >
//       <video
//         ref={(el) => {
//           if (el) remoteVideosRef.current.set(participant.userId, el);
//         }}
//         autoPlay
//         playsInline
//         muted={false}
//         className="w-full h-full object-cover"
//       />

//       {!participant.mediaState.video && (
//         <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
//           <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
//             {participant.username.charAt(0).toUpperCase()}
//           </div>
//         </div>
//       )}

//       <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
//         <div className="flex items-center space-x-1">
//           <span className="text-white text-sm font-medium">
//             {participant.username}
//           </span>
//           {!participant.mediaState.audio && (
//             <MicOff className="w-3 h-3 text-red-400" />
//           )}
//           {participant.isHost && (
//             <span className="text-xs text-yellow-400">HOST</span>
//           )}
//         </div>
//       </div>
//     </div>
//   );

//   if (!isOpen) return null;

//   return (
//     <div
//       className={cn(
//         "fixed inset-0 z-50 bg-gray-900",
//         isFullscreen ? "p-0" : "p-4"
//       )}
//     >
//       {/* Header */}
//       <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
//         <div className="flex items-center space-x-4">
//           <div className="flex items-center space-x-2">
//             <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
//             <span className="text-white font-medium">{room.name}</span>
//           </div>

//           <div className="flex items-center space-x-2 text-gray-300">
//             <Users className="w-4 h-4" />
//             <span>{participants.length + 1}</span>
//           </div>

//           <div className="text-gray-300">
//             {formatCallDuration(callDuration)}
//           </div>
//         </div>

//         <div className="flex items-center space-x-2">
//           <Button
//             variant="ghost"
//             size="icon"
//             onClick={() => setIsFullscreen(!isFullscreen)}
//             className="text-white hover:bg-white/10"
//           >
//             {isFullscreen ? (
//               <Minimize className="w-5 h-5" />
//             ) : (
//               <Maximize className="w-5 h-5" />
//             )}
//           </Button>

//           <Button
//             variant="ghost"
//             size="icon"
//             onClick={() => setShowSettings(!showSettings)}
//             className="text-white hover:bg-white/10"
//           >
//             <Settings className="w-5 h-5" />
//           </Button>
//         </div>
//       </div>

//       {/* Video Grid */}
//       <div className="flex-1 p-4">
//         {screenStream && (
//           <div className="mb-4">
//             <video
//               ref={screenShareRef}
//               autoPlay
//               playsInline
//               muted
//               className="w-full max-h-96 bg-gray-800 rounded-lg object-contain"
//             />
//             <p className="text-center text-gray-400 mt-2">Screen Sharing</p>
//           </div>
//         )}

//         <div
//           className={cn(
//             "grid gap-4 h-full",
//             participants.length === 0
//               ? "grid-cols-1"
//               : participants.length === 1
//               ? "grid-cols-2"
//               : participants.length <= 4
//               ? "grid-cols-2 grid-rows-2"
//               : "grid-cols-3 grid-rows-3"
//           )}
//         >
//           {/* Local Video */}
//           <div className="relative bg-gray-900 rounded-lg overflow-hidden">
//             <video
//               ref={localVideoRef}
//               autoPlay
//               playsInline
//               muted
//               className="w-full h-full object-cover scale-x-[-1]"
//             />

//             {!mediaState.video && (
//               <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
//                 <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
//                   {user?.username.charAt(0).toUpperCase()}
//                 </div>
//               </div>
//             )}

//             <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
//               <div className="flex items-center space-x-1">
//                 <span className="text-white text-sm font-medium">You</span>
//                 {!mediaState.audio && (
//                   <MicOff className="w-3 h-3 text-red-400" />
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Remote Videos */}
//           {participants.map(renderParticipantVideo)}
//         </div>
//       </div>

//       {/* Controls */}
//       <div className="p-6 bg-black/20 backdrop-blur-sm">
//         <div className="flex items-center justify-center space-x-4">
//           <Button
//             variant={mediaState.audio ? "secondary" : "destructive"}
//             size="lg"
//             onClick={toggleAudio}
//             className="rounded-full w-12 h-12"
//           >
//             {mediaState.audio ? (
//               <Mic className="w-5 h-5" />
//             ) : (
//               <MicOff className="w-5 h-5" />
//             )}
//           </Button>

//           {isVideoCall && (
//             <Button
//               variant={mediaState.video ? "secondary" : "destructive"}
//               size="lg"
//               onClick={toggleVideo}
//               className="rounded-full w-12 h-12"
//             >
//               {mediaState.video ? (
//                 <Video className="w-5 h-5" />
//               ) : (
//                 <VideoOff className="w-5 h-5" />
//               )}
//             </Button>
//           )}

//           <Button
//             variant={mediaState.screen ? "secondary" : "outline"}
//             size="lg"
//             onClick={toggleScreenShare}
//             className="rounded-full w-12 h-12"
//           >
//             {mediaState.screen ? (
//               <MonitorOff className="w-5 h-5" />
//             ) : (
//               <Monitor className="w-5 h-5" />
//             )}
//           </Button>

//           <Button
//             variant="destructive"
//             size="lg"
//             onClick={endCall}
//             className="rounded-full w-14 h-14 ml-4"
//           >
//             <PhoneOff className="w-6 h-6" />
//           </Button>
//         </div>
//       </div>

//       {/* Connection Status */}
//       {connectionStatus === "connecting" && (
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-8">
//           <div className="flex flex-col items-center space-y-4">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
//             <p className="text-white">Connecting to call...</p>
//           </div>
//         </div>
//       )}

//       {connectionStatus === "failed" && (
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-8">
//           <div className="flex flex-col items-center space-y-4">
//             <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
//               <PhoneOff className="w-6 h-6 text-white" />
//             </div>
//             <p className="text-white">Failed to connect</p>
//             <Button variant="outline" onClick={onClose}>
//               Close
//             </Button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
