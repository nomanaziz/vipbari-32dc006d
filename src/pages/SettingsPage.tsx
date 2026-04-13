import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BellOff, Loader2, Camera, ImagePlus, User, Lock, DoorOpen, Palette, CreditCard, Zap, Settings2, Globe } from "lucide-react";
import { toast } from "sonner";
import PaymentAccountCard from "@/components/settings/PaymentAccountCard";
import { ColorPresetPicker } from "@/components/ColorPresetPicker";
import UtilitySettingsTab from "@/components/settings/UtilitySettingsTab";
import AdvanceSettingsTab from "@/components/settings/AdvanceSettingsTab";
import ImageCropDialog from "@/components/ImageCropDialog";

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 0.7;

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width;
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

const SettingsPage = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, role, profile, refreshProfile } = useAuth();
  const { isSupported, isSubscribed, subscribe, unsubscribe, loading: notifLoading } = usePushNotifications();

  const showNotifications = role === "landlord" || role === "admin";
  const isLandlord = role === "landlord";

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [changingPin, setChangingPin] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  useState(() => {
    if (profile) {
      setFullName(profile.full_name);
      setEmail(profile.email);
      setPhone(profile.phone);
    }
  });

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropOpen(true);
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  };

  const handleCroppedUpload = async (blob: Blob) => {
    setCropOpen(false);
    setCropFile(null);
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const filePath = `${user.id}/avatar.jpg`;
      await supabase.storage.from("avatars").upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
      await refreshProfile();
      toast.success(t("settings.profile_updated"));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: profileErr } = await supabase.from("profiles").update({ full_name: fullName, phone, email }).eq("user_id", user.id);
      if (profileErr) throw profileErr;
      if (email !== profile?.email) {
        const { error: authErr } = await supabase.auth.updateUser({ email });
        if (authErr) throw authErr;
      }
      await refreshProfile();
      toast.success(t("settings.profile_updated"));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePin = async () => {
    if (newPin.length < 4) { toast.error(t("settings.pin_min_length")); return; }
    if (newPin !== confirmPin) { toast.error(t("settings.pin_mismatch")); return; }
    setChangingPin(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPin });
      if (error) throw error;
      toast.success(t("settings.pin_changed"));
      setNewPin("");
      setConfirmPin("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChangingPin(false);
    }
  };

  const handleNotifToggle = async (checked: boolean) => {
    if (checked) {
      const ok = await subscribe();
      if (ok) toast.success(t("settings.notif_enabled"));
      else toast.error(t("settings.notif_failed"));
    } else {
      const ok = await unsubscribe();
      if (ok) toast.success(t("settings.notif_disabled"));
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">{t("nav.settings")}</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "bn" ? "প্রোফাইল" : "Profile"}</span>
          </TabsTrigger>
          {isLandlord && (
            <TabsTrigger value="payment" className="gap-1.5">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "bn" ? "পেমেন্ট" : "Payment"}</span>
            </TabsTrigger>
          )}
          {isLandlord && (
            <TabsTrigger value="utility" className="gap-1.5">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "bn" ? "ইউটিলিটি" : "Utility"}</span>
            </TabsTrigger>
          )}
          {isLandlord && (
            <TabsTrigger value="advance" className="gap-1.5">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">{language === "bn" ? "অ্যাডভান্স" : "Advance"}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          {/* Color Theme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5" />
                {t("settings.color_theme")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{t("settings.color_theme_desc")}</p>
              <ColorPresetPicker />
            </CardContent>
          </Card>

          {/* Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5" />
                {language === "bn" ? "ভাষা সেটিংস" : "Language Settings"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant={language === "bn" ? "default" : "outline"}
                  onClick={() => setLanguage("bn")}
                >
                  বাংলা
                </Button>
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  onClick={() => setLanguage("en")}
                >
                  English
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                {t("settings.profile")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{profile?.full_name}</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => cameraRef.current?.click()} disabled={uploadingAvatar}>
                      <Camera className="h-4 w-4 mr-1" />
                      {language === "bn" ? "ক্যামেরা" : "Camera"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}>
                      <ImagePlus className="h-4 w-4 mr-1" />
                      {language === "bn" ? "গ্যালারি" : "Gallery"}
                    </Button>
                  </div>
                </div>
                <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleAvatarSelect} disabled={uploadingAvatar} />
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} disabled={uploadingAvatar} />
                <ImageCropDialog file={cropFile} open={cropOpen} onClose={() => { setCropOpen(false); setCropFile(null); }} onCropComplete={handleCroppedUpload} />
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("settings.full_name")}</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("settings.email")}</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("settings.phone")}</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("settings.save")}
              </Button>
            </CardContent>
          </Card>

          {/* Change PIN */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5" />
                {t("settings.change_pin")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("settings.new_pin")}</Label>
                <Input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="••••" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("settings.confirm_pin")}</Label>
                <Input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} placeholder="••••" />
              </div>
              <Button onClick={handleChangePin} disabled={changingPin}>
                {changingPin && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t("settings.change_pin")}
              </Button>
            </CardContent>
          </Card>

          {/* Auto To-Let */}
          {isLandlord && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DoorOpen className="h-5 w-5" />
                  {t("settings.auto_tolet") || "Auto To-Let"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-tolet-toggle">{t("settings.auto_tolet_label") || "Auto-publish vacant rooms"}</Label>
                    <p className="text-sm text-muted-foreground">{t("settings.auto_tolet_desc") || "Automatically list vacant rooms as To-Let"}</p>
                  </div>
                  <Switch
                    id="auto-tolet-toggle"
                    checked={profile?.auto_tolet ?? true}
                    onCheckedChange={async (checked) => {
                      if (!user) return;
                      try {
                        if (checked) {
                          const { data: subs } = await supabase
                            .from("user_subscriptions").select("tolet_count")
                            .eq("user_id", user.id).eq("product_type", "tolet").eq("status", "active")
                            .gte("expires_at", new Date().toISOString());
                          const hasBalance = subs && subs.some(s => s.tolet_count > 0);
                          if (!hasBalance) {
                            toast.error(t("settings.no_tolet_balance") || "No active To-Let subscription.");
                            return;
                          }
                        }
                        const { error } = await supabase.from("profiles").update({ auto_tolet: checked }).eq("user_id", user.id);
                        if (error) throw error;
                        await refreshProfile();
                        toast.success(checked ? (t("settings.auto_tolet_enabled") || "Auto To-Let enabled") : (t("settings.auto_tolet_disabled") || "Auto To-Let disabled"));
                      } catch (err: any) {
                        toast.error(err.message);
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {showNotifications && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5" />
                  {t("settings.notifications")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isSupported ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-toggle">{t("settings.push_notif")}</Label>
                      <p className="text-sm text-muted-foreground">{t("settings.push_notif_desc")}</p>
                    </div>
                    {notifLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <Switch id="push-toggle" checked={isSubscribed} onCheckedChange={handleNotifToggle} />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <BellOff className="h-5 w-5" />
                    <p className="text-sm">{t("settings.push_not_supported")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payment Tab */}
        {isLandlord && (
          <TabsContent value="payment" className="mt-6">
            <PaymentAccountCard />
          </TabsContent>
        )}

        {/* Utility Tab */}
        {isLandlord && (
          <TabsContent value="utility" className="mt-6">
            <UtilitySettingsTab />
          </TabsContent>
        )}

        {/* Advance Tab */}
        {isLandlord && (
          <TabsContent value="advance" className="mt-6">
            <AdvanceSettingsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SettingsPage;
