import { useState, useMemo } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountingEntryDialog, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/components/accounting/AccountingEntryDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, Wallet, Trash2, Calculator } from "lucide-react";
import { format } from "date-fns";

const MONTHS = [
  { value: "all", en: "All Months", bn: "সকল মাস" },
  { value: "01", en: "January", bn: "জানুয়ারি" },
  { value: "02", en: "February", bn: "ফেব্রুয়ারি" },
  { value: "03", en: "March", bn: "মার্চ" },
  { value: "04", en: "April", bn: "এপ্রিল" },
  { value: "05", en: "May", bn: "মে" },
  { value: "06", en: "June", bn: "জুন" },
  { value: "07", en: "July", bn: "জুলাই" },
  { value: "08", en: "August", bn: "আগস্ট" },
  { value: "09", en: "September", bn: "সেপ্টেম্বর" },
  { value: "10", en: "October", bn: "অক্টোবর" },
  { value: "11", en: "November", bn: "নভেম্বর" },
  { value: "12", en: "December", bn: "ডিসেম্বর" },
];

function Accounting() {
  const { user, effectiveOwnerId } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [deleteEntry, setDeleteEntry] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState("all");

  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  // Fetch manual accounting entries
  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["accounting_entries", user?.id, selectedYear, selectedMonth],
    queryFn: async () => {
      let q = supabase
        .from("accounting_entries")
        .select("*")
        .eq("owner_id", effectiveOwnerId!)
        .gte("entry_date", `${selectedYear}-01-01`)
        .lte("entry_date", `${selectedYear}-12-31`)
        .order("entry_date", { ascending: false });

      if (selectedMonth !== "all") {
        q = q.gte("entry_date", `${selectedYear}-${selectedMonth}-01`)
          .lte("entry_date", `${selectedYear}-${selectedMonth}-31`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch verified payments as auto-income
  const { data: autoIncome = [] } = useQuery({
    queryKey: ["auto_income", user?.id, selectedYear, selectedMonth],
    queryFn: async () => {
      let q = supabase
        .from("payments")
        .select("id, amount, payment_date, payment_method, status, tenant_id")
        .eq("owner_id", effectiveOwnerId!)
        .in("status", ["accepted", "verified"])
        .gte("payment_date", `${selectedYear}-01-01`)
        .lte("payment_date", `${selectedYear}-12-31`);

      if (selectedMonth !== "all") {
        q = q.gte("payment_date", `${selectedYear}-${selectedMonth}-01`)
          .lte("payment_date", `${selectedYear}-${selectedMonth}-31`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(p => ({
        id: `auto-${p.id}`,
        type: "income" as const,
        category: "rent_collection",
        amount: p.amount,
        entry_date: p.payment_date,
        description: `${p.payment_method} payment`,
        isAuto: true,
      }));
    },
    enabled: !!user,
  });

  // Combine entries
  const allEntries = useMemo(() => {
    const manual = entries.map(e => ({ ...e, isAuto: false }));
    return [...manual, ...autoIncome].sort(
      (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );
  }, [entries, autoIncome]);

  const incomeEntries = allEntries.filter(e => e.type === "income");
  const expenseEntries = allEntries.filter(e => e.type === "expense");

  const totalIncome = incomeEntries.reduce((s, e) => s + Number(e.amount), 0);
  const totalExpense = expenseEntries.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = totalIncome - totalExpense;

  const addMutation = useMutation({
    mutationFn: async (data: { type: string; category: string; amount: number; entry_date: string; description: string }) => {
      const { error } = await supabase.from("accounting_entries").insert({
        owner_id: effectiveOwnerId!,
        type: data.type,
        category: data.category,
        amount: data.amount,
        entry_date: data.entry_date,
        description: data.description,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounting_entries"] });
      toast.success(language === "bn" ? "সফলভাবে যোগ হয়েছে" : "Entry added successfully");
    },
    onError: () => toast.error(language === "bn" ? "সমস্যা হয়েছে" : "Failed to add entry"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounting_entries").delete().eq("id", id).select();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounting_entries"] });
      toast.success(language === "bn" ? "মুছে ফেলা হয়েছে" : "Entry deleted");
      setDeleteEntry(null);
    },
  });

  const getCategoryLabel = (category: string, type: string) => {
    const list = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const found = list.find(c => c.value === category);
    return found ? (language === "bn" ? found.bn : found.en) : category;
  };

  const renderEntryCard = (entry: any) => (
    <Card key={entry.id} className="mb-2">
      <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{getCategoryLabel(entry.category, entry.type)}</span>
            {entry.isAuto && (
              <Badge variant="secondary" className="text-[10px]">
                {language === "bn" ? "স্বয়ংক্রিয়" : "Auto"}
              </Badge>
            )}
          </div>
          {entry.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(entry.entry_date), "dd MMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`font-semibold text-sm ${entry.type === "income" ? "text-green-600" : "text-red-600"}`}>
            {entry.type === "income" ? "+" : "-"}৳{Number(entry.amount).toLocaleString()}
          </span>
          {!entry.isAuto && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteEntry(entry.id)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold">
            {language === "bn" ? "হিসাব" : "Accounting"}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setIncomeDialogOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="h-4 w-4 mr-1" />
            {language === "bn" ? "আয়" : "Income"}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setExpenseDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {language === "bn" ? "খরচ" : "Expense"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map(m => (
              <SelectItem key={m.value} value={m.value}>{language === "bn" ? m.bn : m.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">৳{totalIncome.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {language === "bn" ? "মোট আয়" : "Income"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-500 flex items-center justify-center shrink-0">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">৳{totalExpense.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {language === "bn" ? "মোট খরচ" : "Expense"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-violet-500 flex items-center justify-center shrink-0">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className={`text-lg font-bold leading-none ${netProfit >= 0 ? "" : "text-red-600"}`}>
                {netProfit >= 0 ? "+" : ""}৳{netProfit.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {language === "bn" ? "নিট লাভ" : "Net"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Tabs */}
      <Tabs defaultValue="income">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="income">
            {language === "bn" ? `আয় (${incomeEntries.length})` : `Income (${incomeEntries.length})`}
          </TabsTrigger>
          <TabsTrigger value="expense">
            {language === "bn" ? `খরচ (${expenseEntries.length})` : `Expenses (${expenseEntries.length})`}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="income">
          {incomeEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {language === "bn" ? "কোনো আয় পাওয়া যায়নি" : "No income entries found"}
            </p>
          ) : incomeEntries.map(renderEntryCard)}
        </TabsContent>
        <TabsContent value="expense">
          {expenseEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {language === "bn" ? "কোনো খরচ পাওয়া যায়নি" : "No expense entries found"}
            </p>
          ) : expenseEntries.map(renderEntryCard)}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AccountingEntryDialog
        open={incomeDialogOpen}
        onOpenChange={setIncomeDialogOpen}
        type="income"
        loading={addMutation.isPending}
        onSubmit={data => addMutation.mutate({ ...data, type: "income" })}
      />
      <AccountingEntryDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        type="expense"
        loading={addMutation.isPending}
        onSubmit={data => addMutation.mutate({ ...data, type: "expense" })}
      />
      <DeleteConfirmDialog
        open={!!deleteEntry}
        onOpenChange={() => setDeleteEntry(null)}
        onConfirm={() => deleteEntry && deleteMutation.mutate(deleteEntry)}
        title={language === "bn" ? "এন্ট্রি মুছুন" : "Delete Entry"}
        description={language === "bn" ? "আপনি কি নিশ্চিত?" : "Are you sure you want to delete this entry?"}
      />
    </div>
  );
}

const AccountingPage = () => (
  <PermissionGuard permission="view_accounting">
    <Accounting />
  </PermissionGuard>
);

export default AccountingPage;
