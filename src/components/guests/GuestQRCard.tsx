import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Clock, CheckCircle2, XCircle, Pencil, Trash2, QrCode, ShieldAlert, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface GuestQRCardProps {
  guest: any;
  language: string;
  onEdit: (g: any) => void;
  onDelete: (id: string) => void;
  onGenerateQR: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onReactivate?: (id: string) => void;
}

const visitorTypeColors: Record<string, string> = {
  guest: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  delivery: "bg-blue-500/10 text-blue-600 border-blue-200",
  worker: "bg-amber-500/10 text-amber-600 border-amber-200",
  family: "bg-purple-500/10 text-purple-600 border-purple-200",
  other: "bg-muted text-muted-foreground",
};

const visitorTypeLabels: Record<string, { en: string; bn: string }> = {
  guest: { en: "Guest", bn: "অতিথি" },
  delivery: { en: "Delivery", bn: "ডেলিভারি" },
  worker: { en: "Worker", bn: "কর্মী" },
  family: { en: "Family", bn: "পরিবার" },
  other: { en: "Other", bn: "অন্যান্য" },
};

export function GuestQRCard({ guest, language, onEdit, onDelete, onGenerateQR, onDeactivate, onReactivate }: GuestQRCardProps) {
  const L = (en: string, bn: string) => language === "bn" ? bn : en;
  const isExpired = guest.expires_at && new Date(guest.expires_at) < new Date();
  const qrUrl = guest.qr_code ? `${window.location.origin}/guest-pass/${guest.qr_code}` : null;

  const handleShare = async () => {
    if (!qrUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Guest Pass - ${guest.guest_name}`, url: qrUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(qrUrl);
      toast.success(L("Link copied!", "লিংক কপি হয়েছে!"));
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold">{guest.guest_name}</p>
              <Badge className={`text-xs ${visitorTypeColors[guest.visitor_type || "guest"]}`}>
                {visitorTypeLabels[guest.visitor_type || "guest"]?.[language === "bn" ? "bn" : "en"]}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {guest.status === "approved" ? (
                <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />{L("Approved", "অনুমোদিত")}
                </Badge>
              ) : guest.status === "rejected" ? (
                <Badge variant="destructive" className="text-xs">
                  <XCircle className="h-3 w-3 mr-1" />{L("Rejected", "প্রত্যাখ্যাত")}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />{L("Pending", "অপেক্ষমাণ")}
                </Badge>
              )}
              {isExpired && (
                <Badge variant="destructive" className="text-xs">{L("Expired", "মেয়াদোত্তীর্ণ")}</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            {guest.status !== "approved" && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(guest)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(guest.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {guest.phone ? `${guest.phone} · ` : ""}{new Date(guest.visit_date).toLocaleDateString()} · {guest.duration_days} {L("day(s)", "দিন")}
        </p>
        {guest.expires_at && (
          <p className="text-xs text-muted-foreground mt-1">
            {L("Expires", "মেয়াদ")}: {new Date(guest.expires_at).toLocaleString()}
          </p>
        )}
        {guest.notes && <p className="text-xs text-muted-foreground mt-1">{guest.notes}</p>}

        {guest.status === "approved" && !isExpired && onDeactivate && (
          <div className="mt-2">
            <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => onDeactivate(guest.id)}>
              <ShieldAlert className="h-3.5 w-3.5" />{L("Deactivate", "নিষ্ক্রিয় করুন")}
            </Button>
          </div>
        )}
        {(guest.status === "rejected" || isExpired) && onReactivate && (
          <div className="mt-2">
            <Button size="sm" variant="outline" className="gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={() => onReactivate(guest.id)}>
              <RefreshCw className="h-3.5 w-3.5" />{L("Reactivate", "পুনরায় সক্রিয় করুন")}
            </Button>
          </div>
        )}

        <div className="mt-3 flex items-center gap-3">
          {guest.qr_code ? (
            <>
              <div className="border rounded-lg p-2 bg-white">
                <QRCodeSVG value={qrUrl!} size={80} />
              </div>
              <div className="flex flex-col gap-1">
                <Button variant="outline" size="sm" className="gap-1" onClick={handleShare}>
                  <Share2 className="h-3.5 w-3.5" />{L("Share", "শেয়ার")}
                </Button>
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => { navigator.clipboard.writeText(qrUrl!); toast.success(L("Copied!", "কপি হয়েছে!")); }}>
                  <Copy className="h-3.5 w-3.5" />{L("Copy", "কপি")}
                </Button>
              </div>
            </>
          ) : (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => onGenerateQR(guest.id)}>
              <QrCode className="h-3.5 w-3.5" />{L("Generate QR", "QR তৈরি করুন")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
