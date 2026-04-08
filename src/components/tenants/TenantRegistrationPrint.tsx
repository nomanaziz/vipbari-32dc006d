import { forwardRef } from "react";

interface TenantData {
  full_name?: string;
  father_name?: string;
  phone?: string;
  secondary_phone?: string;
  email?: string;
  nid?: string;
  passport_number?: string;
  date_of_birth?: string;
  marital_status?: string;
  religion?: string;
  education?: string;
  workplace_address?: string;
  permanent_division?: string;
  permanent_district?: string;
  permanent_thana?: string;
  permanent_village?: string;
  permanent_address?: string;
  emergency_name?: string;
  emergency_relation?: string;
  emergency_address?: string;
  emergency_phone?: string;
  domestic_worker_name?: string;
  domestic_worker_nid?: string;
  domestic_worker_phone?: string;
  domestic_worker_address?: string;
  driver_name?: string;
  driver_nid?: string;
  driver_phone?: string;
  driver_address?: string;
  prev_landlord_name?: string;
  prev_landlord_phone?: string;
  prev_landlord_address?: string;
  prev_leave_reason?: string;
  current_landlord_name?: string;
  current_landlord_phone?: string;
  living_since?: string;
  move_in_date?: string;
  rooms?: { room_number?: string; properties?: { name?: string; division?: string; district?: string; thana?: string; area?: string; house_number?: string; road_number?: string; postal_code?: string } };
}

interface FamilyMember {
  name: string;
  relation?: string;
  phone?: string;
  nid?: string;
}

interface Props {
  tenant: TenantData;
  familyMembers?: FamilyMember[];
}

const maritalLabel: Record<string, string> = {
  married: "বিবাহিত", unmarried: "অবিবাহিত", divorced: "তালাকপ্রাপ্ত", widowed: "বিধবা/বিপত্নীক",
};
const religionLabel: Record<string, string> = {
  islam: "ইসলাম", hinduism: "হিন্দু", christianity: "খ্রিষ্টান", buddhism: "বৌদ্ধ", other: "অন্যান্য",
};

const TenantRegistrationPrint = forwardRef<HTMLDivElement, Props>(({ tenant, familyMembers = [] }, ref) => {
  const t = tenant;
  const prop = t.rooms?.properties;
  const permanentAddr = [t.permanent_village, t.permanent_thana, t.permanent_district, t.permanent_division].filter(Boolean).join(", ");
  const fullPermanent = t.permanent_address ? `${t.permanent_address}, ${permanentAddr}` : permanentAddr;

  return (
    <div ref={ref} className="print-form-container">
      <style>{`
        .print-form-container {
          font-family: 'SolaimanLipi', 'Noto Sans Bengali', 'Kalpurush', sans-serif;
          max-width: 210mm;
          margin: 0 auto;
          padding: 12mm 15mm;
          font-size: 13px;
          line-height: 1.6;
          color: #000;
          background: #fff;
        }
        .print-form-container .form-header {
          text-align: center;
          margin-bottom: 16px;
          border-bottom: 2px solid #000;
          padding-bottom: 12px;
        }
        .print-form-container .form-header h1 {
          font-size: 22px;
          font-weight: bold;
          margin: 0 0 4px;
        }
        .print-form-container .form-header h2 {
          font-size: 18px;
          font-weight: bold;
          text-decoration: underline;
          margin: 8px 0 4px;
        }
        .print-form-container .header-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-top: 6px;
        }
        .print-form-container .field-row {
          display: flex;
          gap: 8px;
          margin-bottom: 6px;
          align-items: baseline;
        }
        .print-form-container .field-label {
          font-weight: 600;
          white-space: nowrap;
        }
        .print-form-container .field-value {
          flex: 1;
          border-bottom: 1px dotted #999;
          min-height: 20px;
          padding-bottom: 1px;
        }
        .print-form-container .field-half {
          display: flex;
          gap: 8px;
          flex: 1;
          align-items: baseline;
        }
        .print-form-container .members-table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
          font-size: 12px;
        }
        .print-form-container .members-table th,
        .print-form-container .members-table td {
          border: 1px solid #000;
          padding: 4px 8px;
          text-align: left;
        }
        .print-form-container .members-table th {
          background: #f0f0f0;
          font-weight: bold;
        }
        .print-form-container .footer-section {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 8px;
        }
        .print-form-container .signature-line {
          border-top: 1px solid #000;
          width: 160px;
          text-align: center;
          padding-top: 4px;
          font-size: 12px;
        }
        .print-form-container .photo-box {
          border: 1px solid #000;
          width: 90px;
          height: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          text-align: center;
          color: #666;
          float: right;
          margin-left: 12px;
        }
        .print-form-container .address-box {
          border: 1px solid #ccc;
          padding: 4px 8px;
          font-size: 11px;
          float: right;
          text-align: right;
          line-height: 1.5;
        }
        @media print {
          body * { visibility: hidden; }
          .print-form-container, .print-form-container * { visibility: visible; }
          .print-form-container { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      {/* Header */}
      <div className="form-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div className="photo-box">ভাড়াটিয়ার এক কপি<br />পাসপোর্ট সাইজ ছবি</div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <h1>ঢাকা মেট্রোপলিটন পুলিশ</h1>
            <div className="header-meta">
              <span>বিভাগ ঃ {prop?.division || "................"}</span>
              <span>থানা ঃ {prop?.thana || "................"}</span>
            </div>
            <h2>ভাড়াটিয়া নিবন্ধন ফরম</h2>
          </div>
          <div className="address-box">
            ফ্ল্যাট/তলা ঃ {t.rooms?.room_number || "........."}<br />
            বাড়ী/হোল্ডিং ঃ {prop?.house_number || "........."}<br />
            রাস্তা ঃ {prop?.road_number || "........."}<br />
            এলাকা ঃ {prop?.area || "........."}<br />
            পোস্ট কোড ঃ {prop?.postal_code || "........."}
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div style={{ clear: "both" }}>
        {/* 1 */}
        <div className="field-row">
          <span className="field-label">১. ভাড়াটিয়া/বাড়ীওয়ালার নাম ঃ</span>
          <span className="field-value">{t.full_name || ""}</span>
        </div>
        {/* 2 */}
        <div className="field-row">
          <span className="field-label">২. পিতার নাম ঃ</span>
          <span className="field-value">{t.father_name || ""}</span>
        </div>
        {/* 3 */}
        <div className="field-row">
          <div className="field-half">
            <span className="field-label">৩. জন্ম তারিখ ঃ</span>
            <span className="field-value">{t.date_of_birth || ""}</span>
          </div>
          <div className="field-half">
            <span className="field-label">বৈবাহিক অবস্থা ঃ</span>
            <span className="field-value">{t.marital_status ? (maritalLabel[t.marital_status] || t.marital_status) : ""}</span>
          </div>
        </div>
        {/* 4 */}
        <div className="field-row">
          <span className="field-label">৪. স্থায়ী ঠিকানা ঃ</span>
          <span className="field-value">{fullPermanent || ""}</span>
        </div>
        {/* 5 */}
        <div className="field-row">
          <span className="field-label">৫. পেশা ও প্রতিষ্ঠান/কর্মস্থলের ঠিকানা ঃ</span>
          <span className="field-value">{t.workplace_address || ""}</span>
        </div>
        {/* 6 */}
        <div className="field-row">
          <div className="field-half">
            <span className="field-label">৬. ধর্ম ঃ</span>
            <span className="field-value">{t.religion ? (religionLabel[t.religion] || t.religion) : ""}</span>
          </div>
          <div className="field-half">
            <span className="field-label">শিক্ষাগত যোগ্যতা ঃ</span>
            <span className="field-value">{t.education || ""}</span>
          </div>
        </div>
        {/* 7 */}
        <div className="field-row">
          <div className="field-half">
            <span className="field-label">৭. মোবাইল নম্বর ঃ</span>
            <span className="field-value">{t.phone || ""}</span>
          </div>
          <div className="field-half">
            <span className="field-label">ই-মেইল আইডি ঃ</span>
            <span className="field-value">{t.email || ""}</span>
          </div>
        </div>
        {/* 8 */}
        <div className="field-row">
          <span className="field-label">৮. জাতীয় পরিচয়পত্র নম্বর ঃ</span>
          <span className="field-value">{t.nid || ""}</span>
        </div>
        {/* 9 */}
        <div className="field-row">
          <span className="field-label">৯. পাসপোর্ট নম্বর (যদি থাকে) ঃ</span>
          <span className="field-value">{t.passport_number || ""}</span>
        </div>
        {/* 10 */}
        <div style={{ marginBottom: 6 }}>
          <span className="field-label">১০. জরুরী যোগাযোগ ঃ</span>
          <div style={{ paddingLeft: 24 }}>
            <div className="field-row">
              <div className="field-half">
                <span className="field-label">(ক) নাম ঃ</span>
                <span className="field-value">{t.emergency_name || ""}</span>
              </div>
              <div className="field-half">
                <span className="field-label">(খ) সম্পর্ক ঃ</span>
                <span className="field-value">{t.emergency_relation || ""}</span>
              </div>
            </div>
            <div className="field-row">
              <div className="field-half">
                <span className="field-label">(গ) ঠিকানা ঃ</span>
                <span className="field-value">{t.emergency_address || ""}</span>
              </div>
              <div className="field-half">
                <span className="field-label">(ঘ) মোবাইল নম্বর ঃ</span>
                <span className="field-value">{t.emergency_phone || ""}</span>
              </div>
            </div>
          </div>
        </div>
        {/* 11 */}
        <div style={{ marginBottom: 6 }}>
          <span className="field-label">১১. পরিবার / মেসের সঙ্গীয় সদস্যদের বিবরণ ঃ</span>
          <table className="members-table">
            <thead>
              <tr>
                <th>ক্রঃ নং</th>
                <th>নাম</th>
                <th>সম্পর্ক</th>
                <th>ফোন</th>
                <th>NID</th>
              </tr>
            </thead>
            <tbody>
              {familyMembers.length > 0 ? familyMembers.map((m, i) => (
                <tr key={i}>
                  <td>{i + 1}।</td>
                  <td>{m.name}</td>
                  <td>{m.relation || ""}</td>
                  <td>{m.phone || ""}</td>
                  <td>{m.nid || ""}</td>
                </tr>
              )) : [1, 2, 3].map(i => (
                <tr key={i}>
                  <td>{i}।</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* 12 */}
        <div className="field-row">
          <div className="field-half">
            <span className="field-label">১২. গৃহকর্মীর নাম ঃ</span>
            <span className="field-value">{t.domestic_worker_name || ""}</span>
          </div>
          <div className="field-half">
            <span className="field-label">জাতীয় পরিচয়পত্র নং ঃ</span>
            <span className="field-value">{t.domestic_worker_nid || ""}</span>
          </div>
        </div>
        <div className="field-row" style={{ paddingLeft: 24 }}>
          <div className="field-half">
            <span className="field-label">মোবাইল নম্বর ঃ</span>
            <span className="field-value">{t.domestic_worker_phone || ""}</span>
          </div>
          <div className="field-half">
            <span className="field-label">স্থায়ী ঠিকানা ঃ</span>
            <span className="field-value">{t.domestic_worker_address || ""}</span>
          </div>
        </div>
        {/* 13 */}
        <div className="field-row">
          <div className="field-half">
            <span className="field-label">১৩. ড্রাইভারের নাম ঃ</span>
            <span className="field-value">{t.driver_name || ""}</span>
          </div>
          <div className="field-half">
            <span className="field-label">জাতীয় পরিচয়পত্র নং ঃ</span>
            <span className="field-value">{t.driver_nid || ""}</span>
          </div>
        </div>
        <div className="field-row" style={{ paddingLeft: 24 }}>
          <div className="field-half">
            <span className="field-label">মোবাইল নম্বর ঃ</span>
            <span className="field-value">{t.driver_phone || ""}</span>
          </div>
          <div className="field-half">
            <span className="field-label">স্থায়ী ঠিকানা ঃ</span>
            <span className="field-value">{t.driver_address || ""}</span>
          </div>
        </div>
        {/* 14 */}
        <div className="field-row">
          <div className="field-half">
            <span className="field-label">১৪. পূর্ববর্তী বাড়িওয়ালার নাম ঃ</span>
            <span className="field-value">{t.prev_landlord_name || ""}</span>
          </div>
          <div className="field-half">
            <span className="field-label">মোবাইল নম্বর ঃ</span>
            <span className="field-value">{t.prev_landlord_phone || ""}</span>
          </div>
        </div>
        <div className="field-row" style={{ paddingLeft: 24 }}>
          <span className="field-label">ঠিকানা ঃ</span>
          <span className="field-value">{t.prev_landlord_address || ""}</span>
        </div>
        {/* 15 */}
        <div className="field-row">
          <span className="field-label">১৫. পূর্ববর্তী বাসা ছাড়ার কারণ ঃ</span>
          <span className="field-value">{t.prev_leave_reason || ""}</span>
        </div>
        {/* 16 */}
        <div className="field-row">
          <div className="field-half">
            <span className="field-label">১৬. বর্তমান বাড়িওয়ালার নাম ঃ</span>
            <span className="field-value">{t.current_landlord_name || ""}</span>
          </div>
          <div className="field-half">
            <span className="field-label">মোবাইল নম্বর ঃ</span>
            <span className="field-value">{t.current_landlord_phone || ""}</span>
          </div>
        </div>
        {/* 17 */}
        <div className="field-row">
          <span className="field-label">১৭. বর্তমান বাড়ীতে কোন তারিখ থেকে বসবাস ঃ</span>
          <span className="field-value">{t.living_since || t.move_in_date || ""}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="footer-section">
        <div>
          <div className="signature-line">তারিখ</div>
        </div>
        <div>
          <div className="signature-line">ভাড়াটিয়ার স্বাক্ষর</div>
        </div>
      </div>
      <p style={{ fontSize: 11, textAlign: "center", marginTop: 16, fontWeight: "bold" }}>
        বিঃ দ্রঃ এই ফরমের একটি কপি বাড়ির মালিক অবশ্যই সংরক্ষণ করবেন।
      </p>
    </div>
  );
});

TenantRegistrationPrint.displayName = "TenantRegistrationPrint";

export default TenantRegistrationPrint;
