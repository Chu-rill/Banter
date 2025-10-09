"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  User,
  Mail,
  Settings,
  Bell,
  Moon,
  Sun,
  Volume2,
  Camera,
  Edit3,
  Save,
  AlertCircle,
  Check,
  LogOut,
  Shield,
  Palette,
  Globe,
  UserIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { uploadApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface UserProfileProps {
  onClose: () => void;
  onOpenThemeCustomizer?: () => void;
}

type ProfileTab = "profile" | "settings" | "notifications";

const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function UserProfile({
  onClose,
  onOpenThemeCustomizer,
}: UserProfileProps) {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setError("");
      setSuccess("");

      // TODO: Implement profile update API call
      console.log("Update profile:", data);

      updateUser({
        username: data.username,
        email: data.email,
      });

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      setError("");
      console.log("Uploading avatar:", file);
      const response = await uploadApi.uploadAvatar(file);
      updateUser({ avatar: response.url });
      setSuccess("Avatar updated successfully!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    reset({
      username: user?.username || "",
      email: user?.email || "",
    });
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    // { id: "settings", label: "Settings", icon: Settings },
    // { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [user?.avatar]);

  return (
    <>
      {/* Mobile backdrop */}
      <div className="fixed inset-0 bg-black z-40 " onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 md:w-80 bg-card border-l border-border flex flex-col max-h-screen shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-background/50 backdrop-blur-sm">
          <h2 className="text-lg font-semibold">User Profile</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProfileTab)}
              className={cn(
                "flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center space-x-2",
                activeTab === tab.id
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="p-4 space-y-6">
              {/* Status Messages */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {success}
                  </p>
                </div>
              )}

              {/* Avatar Section */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="relative">
                    {imageError || !user?.avatar ? (
                      <div className="bg-gray-500 w-12 h-12 rounded-full flex items-center justify-center text-white font-medium">
                        <UserIcon className="w-8 h-8 text-white" />
                      </div>
                    ) : (
                      <img
                        src={user?.avatar}
                        alt={user?.username}
                        className="w-24 h-24 rounded-full object-cover border-4 border-border"
                        onError={() => setImageError(true)}
                      />
                    )}

                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>

                <div className="mt-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {user?.username}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center justify-center space-x-1 mt-1">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        user?.isOnline ? "bg-green-500" : "bg-gray-400"
                      )}
                    />
                    <span className="text-xs text-muted-foreground">
                      {user?.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">
                    Account Information
                  </h4>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className="flex items-center space-x-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save</span>
                      </Button>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Input
                      {...register("username")}
                      label="Username"
                      disabled={!isEditing}
                      error={errors.username?.message}
                      className={cn(
                        !isEditing && "bg-muted cursor-not-allowed"
                      )}
                    />
                  </div>

                  <div>
                    <Input
                      {...register("email")}
                      type="email"
                      label="Email Address"
                      disabled={!isEditing}
                      error={errors.email?.message}
                      className={cn(
                        !isEditing && "bg-muted cursor-not-allowed"
                      )}
                    />
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="p-4 space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">
                  Appearance
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Palette className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Theme & Appearance
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Customize colors and accessibility
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onOpenThemeCustomizer}
                    >
                      Customize
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">
                  Privacy & Security
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Two-Factor Authentication
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Add extra security to your account
                        </p>
                      </div>
                    </div>

                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Online Status</p>
                        <p className="text-xs text-muted-foreground">
                          Show when you're online
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={user?.isOnline}
                        className="sr-only"
                      />
                      <div className="relative">
                        <div className="w-10 h-6 bg-muted rounded-full shadow-inner"></div>
                        <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-1 transition-transform duration-300 ease-in-out"></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">
                  Account Actions
                </h4>

                <div className="space-y-3">
                  <Button
                    variant="destructive"
                    onClick={logout}
                    className="w-full flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="p-4 space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">
                  Push Notifications
                </h4>

                <div className="space-y-3">
                  {[
                    {
                      label: "New Messages",
                      desc: "Get notified when you receive messages",
                    },
                    {
                      label: "Friend Requests",
                      desc: "Get notified about friend requests",
                    },
                    {
                      label: "Call Invitations",
                      desc: "Get notified when someone calls you",
                    },
                    {
                      label: "Room Invites",
                      desc: "Get notified when invited to rooms",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          className="sr-only"
                        />
                        <div className="relative">
                          <div className="w-10 h-6 bg-primary rounded-full shadow-inner"></div>
                          <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-5 transition-transform duration-300 ease-in-out"></div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">
                  Sound & Vibration
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Notification Sounds
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Play sounds for notifications
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="sr-only"
                      />
                      <div className="relative">
                        <div className="w-10 h-6 bg-primary rounded-full shadow-inner"></div>
                        <div className="absolute w-4 h-4 bg-white rounded-full shadow top-1 left-5 transition-transform duration-300 ease-in-out"></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
