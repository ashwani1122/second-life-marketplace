// Profile.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Loader, Edit2, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

/**
 * Profile component (full file)
 * - Reads profile from `profiles` table (falls back to auth user metadata)
 * - Uploads avatar to storage bucket (BUCKET) and upserts avatar_url into profiles
 * - Persists name/phone/location into profiles via upsert
 * - Appends cache-busting `?t=` param to show updated images immediately
 *
 * Notes:
 * - Ensure your Supabase Storage has a bucket named in `BUCKET` (default 'avatars').
 * - For public URLs use public bucket. For private buckets use signed URLs (server-side).
 */

const BUCKET = "avatars"; // Change this if your bucket has a different name

export default function Profile(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch auth user and profile row from `profiles`
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;
        const authUser = authData.user;
        if (!authUser) throw new Error("No authenticated user found");

        // Attempt to read profile row
        const { data: profileRow, error: profileErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        // If no profile row it's okay — we'll create/upsert on save
        if (profileErr && profileErr instanceof Error && (profileErr as any).code !== "PGRST116") {
          // PGRST116 sometimes indicates 'No rows found' in PostgREST — ignore that
          // But if it's another error, throw.
          // Note: Supabase client errors shape can vary; this is defensive.
          if (!String((profileErr as any).message || "").toLowerCase().includes("no rows found")) {
            throw profileErr;
          }
        }

        // Compose initial values (profile preferred, fallback to auth metadata)
        const profile = (profileRow as any) || {};
        const fullName = profile.full_name ?? (authUser.user_metadata as any)?.full_name ?? "";
        const phoneVal = profile.phone ?? (authUser.user_metadata as any)?.phone ?? "";
        const addressVal = profile.location ?? (authUser.user_metadata as any)?.address ?? "";
        const avatar = profile.avatar_url ?? (authUser.user_metadata as any)?.avatar_url ?? null;

        setUser(authUser);
        setName(fullName);
        setPhone(phoneVal);
        setAddress(addressVal);
        setAvatarPreview(avatar ? `${avatar}?t=${Date.now()}` : null);
      } catch (err: any) {
        setError(err?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProfile();
  }, []);

  // Local preview while selecting a file (data URL)
  useEffect(() => {
    if (!avatarFile) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result));
    reader.readAsDataURL(avatarFile);
  }, [avatarFile]);

  // Upload file to storage bucket, then upsert avatar_url into profiles table
  const uploadAndSetAvatar = async (file: File) => {
    setSaving(true);
    setError(null);
    try {
      if (!user) throw new Error("User not loaded");

      const ext = file.name.split(".").pop();
      const filePath = `avatars/${user.id}_${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { upsert: true });

      if (uploadErr) {
        // Friendly message for missing bucket or 404
        const msg = String(uploadErr?.message || uploadErr);
        if (msg.toLowerCase().includes("bucket not found") || (uploadErr as any)?.status === 404) {
          throw new Error(`Storage bucket "${BUCKET}" not found. Create it in Supabase Storage or change BUCKET.`);
        }
        throw uploadErr;
      }

      // getPublicUrl (public buckets only)
      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      const publicUrl = (publicData as any)?.publicUrl ?? (publicData as any)?.public_url ?? null;
      if (!publicUrl) throw new Error("Failed to get public URL for avatar (is bucket public?)");

      // Upsert into profiles table (id = user.id)
      const profilePayload: any = {
        id: user.id,
        avatar_url: publicUrl,
      };
      // If you also want to persist current name/phone/address, include them:
      if (name) profilePayload.full_name = name;
      if (phone) profilePayload.phone = phone;
      if (address) profilePayload.location = address;

      const { error: upsertErr } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id", returning: "minimal" });

      if (upsertErr) throw upsertErr;

      // Update UI immediately, and append cache-busting timestamp so browser pulls fresh image
      setAvatarPreview(`${publicUrl}?t=${Date.now()}`);
      setAvatarFile(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to upload avatar");
      // visible alert is helpful during development
      // alert(err?.message || "Failed to upload avatar");
    } finally {
      setSaving(false);
    }
  };

  // File select handler (immediately uploads and persists)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setAvatarFile(f);
    // Immediately upload to persist — change this if you prefer to defer to "Save"
    uploadAndSetAvatar(f);
  };

  // Save name/phone/address to profiles table
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!user) throw new Error("User not loaded");
      if (!name.trim()) throw new Error("Name is required");

      const payload: any = {
        id: user.id,
        full_name: name,
        phone,
        location: address,
        avatar_url: avatarPreview ? avatarPreview.split("?t=")[0] : null,
      };

      const { error: upsertErr } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id", returning: "representation" });

      if (upsertErr) throw upsertErr;

      // re-fetch the profile row to be sure
      const { data: refreshed } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (refreshed) {
        setName(refreshed.full_name ?? name);
        setPhone(refreshed.phone ?? phone);
        setAddress(refreshed.location ?? address);
        setAvatarPreview(refreshed.avatar_url ? `${refreshed.avatar_url}?t=${Date.now()}` : avatarPreview);
      }

      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-900 p-6">
      {loading ? (
        <div className="flex items-center justify-center w-full h-64">
          <Loader className="animate-spin text-white" />
        </div>
      ) : error ? (
        <div className="max-w-md w-full bg-white/5 border border-red-400 text-red-200 p-4 rounded-lg">Error: {error}</div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-3xl mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-10"
        >
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <div className="relative flex-shrink-0">
              <div className="rounded-full overflow-hidden w-36 h-36 bg-gradient-to-br from-indigo-500 to-pink-500 p-1">
                <div className="rounded-full bg-white/90 w-full h-full flex items-center justify-center">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="avatar" className="w-32 h-32 rounded-full object-cover" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center text-3xl font-semibold text-white">
                      {name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              </div>

              <label className="mt-2 block text-sm text-slate-300 text-center w-full cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                <span className="inline-flex mt-2 items-center cursor-pointer text-xs text-slate-200 hover:underline">
                  Upload avatar
                </span>
              </label>
            </div>

            <div className="flex-1 w-full">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{name || "Your profile"}</h2>
                  <p className="text-sm text-slate-300 mt-1">Member since {new Date((user?.created_at as any) || Date.now()).toLocaleDateString()}</p>
                </div>

                <div className="flex gap-2">
                  <HoverBorderGradient containerClassName="rounded-full" as="button" className="px-3 py-2 bg-white/90 text-slate-900 flex items-center gap-2" onClick={() => setIsEditing((s) => !s)}>
                    <Edit2 size={16} />
                    <span className="text-sm">{isEditing ? "Cancel" : "Edit"}</span>
                  </HoverBorderGradient>

                  <HoverBorderGradient containerClassName="rounded-full" as="button" className="px-3 py-2 bg-transparent border border-white/10 text-white flex items-center gap-2" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span className="text-sm">Logout</span>
                  </HoverBorderGradient>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm text-slate-300">Email</div>
                    <div className="text-white font-medium">{user?.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm text-slate-300">Phone</div>
                    <div className="text-white font-medium">{phone || "—"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="col-span-1">
                    <div className="text-sm text-slate-300">Address</div>
                    <div className="text-white font-medium">{address || "—"}</div>
                  </div>
                </div>

                <div className="flex item-center justify-between ">
                  <p className="text-md text-slate-300 mt-1 flex flex-col">
                    <span>Member since </span>
                    <span className="text-white font-medium">{new Date((user?.created_at as any) || Date.now()).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>

              {isEditing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 bg-white/6 p-4 rounded-lg border border-white/8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Full name</label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Phone</label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm text-slate-300 mb-1">Address</label>
                      <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <Button disabled={saving} onClick={handleSave}>
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>
                      Close
                    </Button>
                    {error && <div className="text-sm text-red-400 ml-3">{error}</div>}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <footer className="mt-6 text-xs text-slate-400 text-right">Tip: keep your profile information up to date</footer>
        </motion.div>
      )}
    </div>
  );
}
