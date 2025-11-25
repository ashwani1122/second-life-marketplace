import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Loader, Edit2, LogOut, Mail, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";

// A polished, single-file Profile component designed for tailwind/shadcn projects.
// - responsive card
// - avatar preview + upload (preview only — adjust upload logic for your storage)
// - inline edit mode with validation and supabase update
// - subtle animations

export default function Profile() {
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

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        const u = data.user;
        setUser(u);
        setName((u?.user_metadata as any)?.full_name || "");
        setPhone((u?.user_metadata as any)?.phone || "");
        setAddress((u?.user_metadata as any)?.address || "");
        setAvatarPreview((u?.user_metadata as any)?.avatar_url || null);
      } catch (err: any) {
        setError(err?.message || "Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!avatarFile) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result));
    reader.readAsDataURL(avatarFile);
  }, [avatarFile]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      // navigate away in your router if needed — this file intentionally leaves navigation to the parent app
      window.location.href = "/";
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Basic validation
      if (!name.trim()) throw new Error("Name is required");

      // NOTE: This updates the user's metadata through Supabase Auth. If you store profiles in a separate table, adapt accordingly.
      const { error: updateError } = await supabase.auth.updateUser({ data: { full_name: name, phone, address, avatar_url: avatarPreview } });
      if (updateError) throw updateError;

      // refetch user to sync local state
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setSaving(false);
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
                    <img src={avatarPreview} alt="avatar" className="w-32 h-32 rounded-full object-cover" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center text-3xl font-semibold text-white">
                      {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              </div>

              <label className="mt-2 block text-sm text-slate-300 text-center w-full">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f) setAvatarFile(f);
                  }}
                />
                <span className="inline-flex mt-2 items-center cursor-pointer text-xs text-slate-200 hover:underline">
                  Upload avatar
                </span>
              </label>
            </div>

            <div className="flex-1 w-full">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{user?.user_metadata?.full_name || "Your profile"}</h2>
                  <p className="text-sm text-slate-300 mt-1">Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
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
                  <Mail className="text-slate-300" />
                  <div>
                    <div className="text-sm text-slate-300">Email</div>
                    <div className="text-white font-medium">{user?.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="text-slate-300" />
                  <div>
                    <div className="text-sm text-slate-300">Phone</div>
                    <div className="text-white font-medium">{user?.user_metadata?.phone || "—"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="text-slate-300" />
                  <div className="col-span-1">
                    <div className="text-sm text-slate-300">Address</div>
                    <div className="text-white font-medium">{user?.user_metadata?.address || "—"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-300">Account ID</div>
                  <div className="text-white font-mono text-sm truncate max-w-xs">{user?.id}</div>
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
                    <Button disabled={saving} onClick={handleSave}>{saving ? "Saving..." : "Save changes"}</Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>Close</Button>
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
