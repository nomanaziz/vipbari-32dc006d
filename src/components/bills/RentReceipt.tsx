import React from "react";

interface BillData {
  id: string;
  month: string;
  rent_amount?: number;
  electricity_charge?: number;
  water_charge?: number;
  gas_charge?: number;
  service_charge?: number;
  garage_charge?: number;
  other_charges?: number;
  vat?: number;
  advance?: number;
  total_amount: number;
  received_amount?: number;
  tenants?: { full_name?: string; phone?: string };
  rooms?: { room_number?: string; properties?: { name?: string } };
  landlordName?: string;
  landlordPhone?: string;
}

interface RentReceiptProps {
  bills: BillData[];
  showLandlordCopy?: boolean;
}

const ReceiptCopy = ({ bill, copyLabel }: { bill: BillData; copyLabel: string }) => {
  const items = [
    { label: "বাড়ি ভাড়া", value: Number(bill.rent_amount || 0) },
    { label: "গ্যাস বিল", value: Number(bill.gas_charge || 0) },
    { label: "বিদ্যুৎ বিল", value: Number(bill.electricity_charge || 0) },
    { label: "পানির বিল", value: Number(bill.water_charge || 0) },
    { label: "সার্ভিস চার্জ", value: Number(bill.service_charge || 0) },
    { label: "গ্যারেজ", value: Number(bill.garage_charge || 0) },
    { label: "অন্যান্য", value: Number(bill.other_charges || 0) },
    { label: "ভ্যাট", value: Number(bill.vat || 0) },
    { label: "অগ্রিম কর্তন", value: Number(bill.advance || 0) },
  ];

  const total = Number(bill.total_amount || 0);
  const received = Number(bill.received_amount || 0);
  const due = total - received;
  const today = new Date().toLocaleDateString("bn-BD");

  return (
    <div className="receipt-copy border border-black p-3 text-[11px] leading-tight font-['Hind_Siliguri',sans-serif]">
      <div className="text-center border-b border-black pb-1 mb-2">
        <h2 className="text-sm font-bold">ভাড়ার রশিদ</h2>
        <p className="text-[10px] text-gray-600">({copyLabel})</p>
      </div>

      <div className="space-y-0.5 mb-2">
        <div className="flex justify-between">
          <span>বাড়ির নামঃ</span>
          <span className="font-semibold">{bill.rooms?.properties?.name || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span>ফ্ল্যাট/রুম নংঃ</span>
          <span className="font-semibold">{bill.rooms?.room_number || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span>মালিকের নামঃ</span>
          <span className="font-semibold">{bill.landlordName || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span>মালিকের মোবাইলঃ</span>
          <span className="font-semibold">{bill.landlordPhone || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span>ভাড়াটিয়ার নামঃ</span>
          <span className="font-semibold">{bill.tenants?.full_name || "—"}</span>
        </div>
        <div className="flex justify-between">
          <span>মাসঃ</span>
          <span className="font-semibold">{bill.month}</span>
        </div>
      </div>

      <div className="border-t border-b border-black py-1 my-1">
        <table className="w-full">
          <tbody>
            {items.map((item) => (
              <tr key={item.label}>
                <td className="py-0.5">{item.label}</td>
                <td className="text-right py-0.5">৳{item.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-0.5 my-1">
        <div className="flex justify-between font-bold text-xs border-b border-dashed border-black pb-1">
          <span>সর্বমোটঃ</span>
          <span>৳{total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>জমাঃ</span>
          <span>৳{received.toLocaleString()}</span>
        </div>
        {due > 0 && (
          <div className="flex justify-between font-semibold text-red-700">
            <span>বকেয়াঃ</span>
            <span>৳{due.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-2 text-[10px]">
        <span>তারিখঃ {today}</span>
      </div>

      <div className="flex justify-between mt-8 pt-1 border-t border-dashed border-black text-[10px]">
        <div className="text-center">
          <div className="border-t border-black w-20 mb-0.5"></div>
          <span>{copyLabel === "মালিকের অংশ" ? "ভাড়াটিয়ার স্বাক্ষর" : "মালিকের স্বাক্ষর"}</span>
        </div>
        <div className="text-center">
          <div className="border-t border-black w-20 mb-0.5"></div>
          <span>{copyLabel === "মালিকের অংশ" ? "মালিকের স্বাক্ষর" : "ভাড়াটিয়ার স্বাক্ষর"}</span>
        </div>
      </div>
    </div>
  );
};

const RentReceipt: React.FC<RentReceiptProps> = ({ bills, showLandlordCopy = true }) => {
  return (
    <div className="print-receipt">
      {bills.map((bill, idx) => (
        <div
          key={bill.id}
          className={`receipt-page ${showLandlordCopy ? "flex justify-between gap-2" : "flex justify-center"} p-2`}
          style={{ pageBreakAfter: idx < bills.length - 1 ? "always" : "auto" }}
        >
          {showLandlordCopy && (
            <div className="w-[48%]">
              <ReceiptCopy bill={bill} copyLabel="মালিকের অংশ" />
            </div>
          )}
          <div className={showLandlordCopy ? "w-[48%]" : "w-[60%]"}>
            <ReceiptCopy bill={bill} copyLabel="ভাড়াটিয়ার অংশ" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default RentReceipt;
