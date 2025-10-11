"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  User,
  Camera,
  Edit3,
  Save,
  AlertCircle,
  Check,
  LogOut,
  Palette,
  Shield,
  Globe,
  Bell,
  Volume2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { uploadApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import Loader from "@/components/ui/Loader";

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
  email: z.string().min(1, "Email is required").email(),
  bio: z.string().max(200, "Bio must be less than 200 characters").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function UserProfile({
  onClose,
  onOpenThemeCustomizer,
}: UserProfileProps) {
  const { user, updateUser, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now());

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
      bio: user?.bio || "",
    },
  });

  useEffect(() => {
    reset({
      username: user?.username || "",
      email: user?.email || "",
      bio: user?.bio || "",
    });
    setImageError(false);
    setAvatarKey(Date.now());
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setError("");
      setSuccess("");
      await updateUser({
        username: data.username,
        email: data.email,
        bio: data.bio,
      });
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(e.response?.data?.message || "Failed to update profile");
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/"))
      return setError("Please select an image file");
    if (file.size > 5 * 1024 * 1024)
      return setError("Image must be less than 5MB");

    try {
      setIsUploading(true);
      setError("");
      await uploadApi.uploadAvatar(file);
      await refreshUser();
      setSuccess("Avatar updated successfully!");
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(e.response?.data?.message || "Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    reset({
      username: user?.username || "",
      email: user?.email || "",
      bio: user?.bio || "",
    });
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    // { id: "settings", label: "Settings", icon: Palette },
    // { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/80 z-40"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-[#1e1e1e] border-2 border-black dark:border-[#2d2d2d] rounded-xl flex flex-col max-h-[90vh] shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-black dark:border-[#2d2d2d] flex items-center justify-between bg-white dark:bg-[#1e1e1e] rounded-t-xl">
            <h2 className="text-lg font-semibold text-black dark:text-white">
              User Profile
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-black dark:border-[#2d2d2d] bg-white dark:bg-[#1e1e1e]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={cn(
                  "flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center space-x-2",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin bg-white dark:bg-[#1e1e1e]">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="p-4 space-y-6">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-500 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-400">
                      {success}
                    </p>
                  </div>
                )}

                {/* Avatar */}
                <div className="text-center">
                  <div className="relative inline-block">
                    {imageError || !user?.avatar ? (
                      <div className="w-24 h-24 rounded-full flex items-center justify-center bg-gray-200 dark:bg-muted">
                        <User className="w-8 h-8 text-gray-500 dark:text-muted-foreground" />
                      </div>
                    ) : (
                      <img
                        key={avatarKey}
                        src={`${user?.avatar}${
                          user?.avatar.includes("?") ? "&" : "?"
                        }t=${avatarKey}`}
                        alt={user?.username}
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-300 dark:border-border"
                        onError={() => setImageError(true)}
                      />
                    )}

                    {isUploading && (
                      <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                        <Loader size={24} color="#ffffff" />
                      </div>
                    )}

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
                    <h3 className="text-lg font-semibold text-black dark:text-white">
                      {user?.username}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user?.email}
                    </p>
                    <div className="flex items-center justify-center space-x-1 mt-1">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          user?.isOnline ? "bg-green-500" : "bg-gray-400"
                        )}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {user?.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-black dark:text-white">
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
                        >
                          <Save className="w-3 h-3 mr-1" />
                          <span>Save</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                      {...register("username")}
                      label="Username"
                      disabled={!isEditing}
                      error={errors.username?.message}
                      className={cn(
                        !isEditing &&
                          "bg-gray-100 dark:bg-muted cursor-not-allowed"
                      )}
                    />
                    <Input
                      {...register("email")}
                      label="Email Address"
                      type="email"
                      disabled={!isEditing}
                      error={errors.email?.message}
                      className={cn(
                        !isEditing &&
                          "bg-gray-100 dark:bg-muted cursor-not-allowed"
                      )}
                    />
                    <div>
                      <label className="block text-sm font-medium text-black dark:text-white mb-2">
                        Bio
                      </label>
                      <textarea
                        {...register("bio")}
                        disabled={!isEditing}
                        rows={3}
                        maxLength={200}
                        placeholder="Tell us about yourself..."
                        className={cn(
                          "w-full px-3 py-2 border-2 border-gray-300 dark:border-[#2d2d2d] rounded-lg bg-white dark:bg-[#2a2a2a] text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-none",
                          !isEditing &&
                            "bg-gray-100 dark:bg-[#252525] cursor-not-allowed"
                        )}
                      />
                      {errors.bio && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.bio.message}
                        </p>
                      )}
                      {isEditing && (
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 text-right">
                          {200 -
                            ((register("bio") as unknown as { value: string })
                              ?.value?.length || 0)}{" "}
                          characters remaining
                        </p>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="p-4 space-y-4 text-black dark:text-white">
                <p>
                  Theme settings, privacy settings, and other preferences go
                  here.
                </p>
                <Button onClick={onOpenThemeCustomizer} className="w-full">
                  Customize Theme
                </Button>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="p-4 space-y-4 text-black dark:text-white">
                <p>Manage notification preferences here.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-black dark:border-[#2d2d2d] bg-white dark:bg-[#1e1e1e] rounded-b-xl">
            <Button
              variant="destructive"
              size="sm"
              className="w-full flex items-center justify-center space-x-2"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
