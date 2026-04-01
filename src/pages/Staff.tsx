import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { UserCog, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import StaffInviteDialog from "@/components/staff/StaffInviteDialog";
import StaffEditDialog from "@/components/staff/StaffEditDialog";
import StaffPasswordDialog from "@/components/staff/StaffPasswordDialog";
import StaffCard from "@/components/staff/StaffCard";
import SalaryPayDialog from "@/components/staff/SalaryPayDialog";

const Staff = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    full_name: "", phone: "", preset_id: "", is_active: true,
    permanent_address: "", present_address: "", nid_number: "", doc_type: "nid",
    date_of_birth: "", salary: "", joining_date: "",
  });
  const [pwOpen, setPwOpen] = useState(false);
  const [pwStaff, setPwStaff] = useState<any>(null);
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [salaryStaff, setSalaryStaff] = useState<any>(null);

  const { data: presets } = useQuery({
    queryKey: ["permission-presets", "landlord"],
    queryFn: async () => {
      const { data } = await supabase.from("permission_presets").select("*").eq("scope", "landlord");
      return data || [];
    },
  });

  const { data: staffList, isLoading } = useQuery({
    queryKey: ["my-staff", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("staff_assignments")
        .select("*, permission_presets(name, permissions), staff_details(*)")
        .eq("landlord_id", user!.id);
      if (!data || data.length === 0) return [];
      const userIds = data.map((s: any) => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, email, is_active")
        .in("user_id", userIds);
      return data.map((s: any) => ({
        ...s,
        profile: profiles?.find((p: any) => p.user_id === s.user_id),
      }));
    },
    enabled: !!user,
  });

  const inviteStaff = useMutation({
    mutationFn: async (form: any) => {
      const { data, error } = await supabase.functions.invoke("invite-staff", {
        body: { ...form, role: "landlord_staff", landlord_id: user!.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-staff"] });
      toast.success("স্টাফ সফলভাবে যোগ হয়েছে");
    },
    onError: (e: any) => toast.error(e.message || "Failed to invite staff"),
  });

  const updateStaff = useMutation({
    mutationFn: async () => {
      if (!editingStaff) return;
      const { error: assignErr } = await supabase
        .from("staff_assignments")
        .update({ preset_id: editForm.preset_id })
        .eq("id", editingStaff.id);
      if (assignErr) throw assignErr;
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ full_name: editForm.full_name, phone: editForm.phone, is_active: editForm.is_active })
        .eq("user_id", editingStaff.user_id);
      if (profileErr) throw profileErr;

      // Upsert staff_details
      const detailsPayload = {
        staff_assignment_id: editingStaff.id,
        permanent_address: editForm.permanent_address,
        present_address: editForm.present_address,
        nid_number: editForm.nid_number,
        doc_type: editForm.doc_type,
        date_of_birth: editForm.date_of_birth || null,
        salary: parseFloat(editForm.salary) || 0,
        joining_date: editForm.joining_date || null,
      };

      const existingDetail = editingStaff.staff_details?.[0];
      if (existingDetail) {
        const { error } = await supabase.from("staff_details").update(detailsPayload).eq("id", existingDetail.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff_details").insert(detailsPayload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-staff"] });
      toast.success("স্টাফ আপডেট হয়েছে");
      setEditOpen(false);
      setEditingStaff(null);
    },
    onError: (e: any) => toast.error(e.message || "Failed to update staff"),
  });

  const removeStaff = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.from("staff_assignments").delete().eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-staff"] });
      toast.success("স্টাফ সরানো হয়েছে");
    },
    onError: () => toast.error("Failed to remove staff"),
  });

  const openEdit = (staff: any) => {
    const details = staff.staff_details?.[0];
    setEditingStaff(staff);
    setEditForm({
      full_name: staff.profile?.full_name || "",
      phone: staff.profile?.phone || "",
      preset_id: staff.preset_id || "",
      is_active: staff.profile?.is_active !== false,
      permanent_address: details?.permanent_address || "",
      present_address: details?.present_address || "",
      nid_number: details?.nid_number || "",
      doc_type: details?.doc_type || "nid",
      date_of_birth: details?.date_of_birth || "",
      salary: details?.salary?.toString() || "",
      joining_date: details?.joining_date || "",
    });
    setEditOpen(true);
  };

  const openPassword = (staff: any) => {
    setPwStaff(staff);
    setPwOpen(true);
  };

  const openSalary = (staff: any) => {
    setSalaryStaff(staff);
    setSalaryOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">স্টাফ</h1>
          <p className="text-sm text-muted-foreground">আপনার স্টাফ যোগ করুন ও পারমিশন দিন</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/roles")}>
            <Shield className="mr-2 h-4 w-4" />
            ভূমিকা ব্যবস্থাপনা
          </Button>
          <StaffInviteDialog
            presets={presets || []}
            onInvite={(form) => inviteStaff.mutate(form)}
            isPending={inviteStaff.isPending}
          />
        </div>
      </div>

      <StaffEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        presets={presets || []}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={() => updateStaff.mutate()}
        isPending={updateStaff.isPending}
        email={editingStaff?.profile?.email}
      />

      {pwStaff && (
        <StaffPasswordDialog
          open={pwOpen}
          onOpenChange={setPwOpen}
          staffName={pwStaff.profile?.full_name || "Staff"}
          staffUserId={pwStaff.user_id}
        />
      )}

      {salaryStaff && (
        <SalaryPayDialog
          open={salaryOpen}
          onOpenChange={setSalaryOpen}
          staffName={salaryStaff.profile?.full_name || "Staff"}
          staffAssignmentId={salaryStaff.id}
          defaultSalary={salaryStaff.staff_details?.[0]?.salary || 0}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            আপনার স্টাফ সদস্য ({staffList?.length || 0})
          </CardTitle>
          <CardDescription>স্টাফ যোগ করুন, রোল ও পারমিশন দিন</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">লোড হচ্ছে...</div>
          ) : !staffList?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCog className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>কোনো স্টাফ সদস্য নেই। প্রথম স্টাফ যোগ করুন!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffList.map((staff: any) => (
                <StaffCard
                  key={staff.id}
                  staff={staff}
                  onEdit={() => openEdit(staff)}
                  onPassword={() => openPassword(staff)}
                  onDelete={() => removeStaff.mutate(staff.id)}
                  onPaySalary={() => openSalary(staff)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Staff;
