"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  User,
  Calendar,
  Receipt,
  FileText,
  AlertCircle,
  CheckCircle,
  Printer,
  Sparkles,
  ClipboardList,
} from "lucide-react";

function PatientDashboardContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [activeTab, setActiveTab] = useState("records");
  const [profileId, setProfileId] = useState("");
  const [chart, setChart] = useState<any>(null);

  // Global settings for dynamic currency
  const [globalSettings, setGlobalSettings] = useState<any>({
    businessName: "Nepal Skin & Hair Clinic",
    currency: "NPR",
  });

  // Booking states
  const [clinics, setClinics] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appForm, setAppForm] = useState({
    doctorId: "",
    clinicId: "",
    appointmentDate: "",
    type: "CONSULTATION",
    notes: "",
  });

  // Selected item details for printable popups
  const [selectedRx, setSelectedRx] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Sync activeTab with URL params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
      setErrorMsg("");
      setSuccessMsg("");
      setSelectedRx(null);
      setSelectedInvoice(null);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchSessionAndChart();
    loadBookingMasters();
    fetchSettings();
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) setGlobalSettings(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessionAndChart = async () => {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) throw new Error("Authentication failed");
      const meData = await meRes.json();
      const pId = meData.user.profileId;

      if (!pId) {
        setErrorMsg("Patient profile mapping is missing in user session.");
        return;
      }
      setProfileId(pId);

      const chartRes = await fetch(`/api/patients/${pId}`);
      if (!chartRes.ok) throw new Error("Failed to load patient chart data");
      setChart(await chartRes.json());
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load patient dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadBookingMasters = async () => {
    try {
      const [resC, resD] = await Promise.all([
        fetch("/api/clinics"),
        fetch("/api/doctors"),
      ]);
      if (resC.ok) setClinics(await resC.json());
      if (resD.ok) setDoctors(await resD.json());
    } catch (err) {
      console.error(err);
    }
  };

  // Handle self-booking appointment
  const handleSelfBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!profileId) {
      setErrorMsg("Unauthorized session.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: profileId,
          doctorId: appForm.doctorId,
          clinicId: appForm.clinicId,
          appointmentDate: appForm.appointmentDate,
          type: appForm.type,
          notes: appForm.notes || "Self-booked via Patient Portal",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      setSuccessMsg("Appointment booked successfully! Roster Token will be issued at checked-in desk on arrival.");
      setAppForm({ doctorId: "", clinicId: "", appointmentDate: "", type: "CONSULTATION", notes: "" });
      fetchSessionAndChart();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  // Fetch individual prescription for printing
  const loadRxPrint = async (rxId: string) => {
    try {
      const res = await fetch(`/api/prescriptions/${rxId}`);
      if (res.ok) {
        setSelectedRx(await res.json());
        setSelectedInvoice(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch individual invoice for printing
  const loadInvoicePrint = async (invId: string) => {
    try {
      const res = await fetch(`/api/billing/invoices/${invId}`);
      if (res.ok) {
        setSelectedInvoice(await res.json());
        setSelectedRx(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Patient demographics header card */}
      {chart && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden animate-fadeIn">
          <div className="absolute top-[-50%] right-[-10%] w-[30%] h-[150%] bg-emerald-955/10 rounded-full blur-[80px]" />
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 bg-emerald-955 border border-emerald-900/40 text-emerald-400 rounded-xl">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">{chart.name}</h2>
              <p className="text-xs text-slate-450 mt-1">
                Unique MRN: <strong className="text-emerald-455">{chart.mrn}</strong> • Phone: {chart.mobile}
              </p>
            </div>
          </div>

          <div className="relative z-10 text-xs bg-slate-950/45 border border-slate-850 px-4 py-3 rounded-lg text-slate-400 space-y-1">
            <div className="flex justify-between gap-4">
              <span>Outstanding Dues:</span>
              <strong className={chart.outstandingBalance > 0 ? "text-amber-500 font-bold" : "text-emerald-450"}>
                {globalSettings.currency} {chart.outstandingBalance.toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Allergies:</span>
              <strong className="text-rose-455">{chart.allergies || "None"}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-955/35 border border-emerald-800/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2.5">
          <CheckCircle className="h-5 w-5 text-emerald-455 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-955/20 border border-rose-900/35 text-rose-350 rounded-xl text-xs flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 text-rose-455 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-1">
        {[
          { id: "records", label: "My Medical Record", icon: ClipboardList },
          { id: "treatment", label: "Treatment Packages", icon: Sparkles },
          { id: "billing", label: "Bills & Receipts", icon: Receipt },
          { id: "book", label: "Book Slot", icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedRx(null);
                setSelectedInvoice(null);
              }}
              className={`py-3 px-5 text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? "border-emerald-500 text-emerald-450 bg-slate-900/20"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {chart && (
        <div className="space-y-6">
          
          {/* TAB 1: VISIT HISTORY & Rx */}
          {activeTab === "records" && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 border-b border-slate-850 pb-3">My OP Consultation History</h3>
              
              {chart.consultations.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 italic text-center">No consultation history records found.</p>
              ) : (
                <div className="divide-y divide-slate-850">
                  {chart.consultations.map((c: any) => (
                    <div key={c.id} className="py-4.5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-slate-550 block">{new Date(c.date).toLocaleDateString("en-IN")}</span>
                          <h4 className="text-xs font-bold text-white mt-0.5">{c.provisionalDiagnosis}</h4>
                          <p className="text-xs text-slate-400 mt-1">Consulting Doctor: Dr. {c.doctor.name}</p>
                        </div>
                        {c.prescription && (
                          <button
                            onClick={() => loadRxPrint(c.prescription.id)}
                            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-755 text-emerald-400 border border-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1"
                          >
                            <FileText className="h-3.5 w-3.5" /> View Prescription
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-slate-455 leading-relaxed bg-slate-950/20 p-3 rounded-lg border border-slate-850">
                        <strong className="text-slate-300 block mb-1">Chief Complaint:</strong>
                        "{c.chiefComplaint}" (Symptoms duration: {c.duration})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TREATMENT PACKAGES */}
          {activeTab === "treatment" && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-355 border-b border-slate-855 pb-3">My Treatment Rota Progress</h3>

              {chart.treatmentPlans.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 italic text-center">No active or completed treatment packages advised.</p>
              ) : (
                <div className="divide-y divide-slate-850">
                  {chart.treatmentPlans.map((plan: any) => {
                    const completedSessions = plan.sessions.filter((s: any) => s.status === "COMPLETED").length;
                    return (
                      <div key={plan.id} className="py-4.5 space-y-4">
                        
                        <div className="flex justify-between items-start text-xs">
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${
                              plan.status === "COMPLETED" ? "bg-emerald-955/40 border border-emerald-900/30 text-emerald-450" : "bg-sky-955/35 border border-sky-900/35 text-sky-400"
                            }`}>
                              {plan.status}
                            </span>
                            <h4 className="text-xs font-bold text-white mt-1.5">{plan.catalogItem.name}</h4>
                            <p className="text-[10px] text-slate-450 mt-1">Specialist: Dr. {plan.doctor.name}</p>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-400 block">Package Cost: {globalSettings.currency} {plan.totalPrice}</span>
                            <span className="text-[10px] text-slate-500 mt-1 block">Consent signed: {plan.consentSigned ? "YES" : "NO"}</span>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-slate-450 text-[10px]">
                            <span>Sittings Progress Tracker:</span>
                            <span>{completedSessions} of {plan.totalSessions} Sessions Completed</span>
                          </div>
                          <div className="h-2 w-full bg-slate-955 border border-slate-850 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${(completedSessions / plan.totalSessions) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-2">
                          {plan.sessions.map((s: any) => (
                            <div
                              key={s.id}
                              className={`p-2.5 rounded-lg border text-center text-xs flex flex-col justify-center ${
                                s.status === "COMPLETED"
                                  ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
                                  : "bg-slate-950/45 border-slate-850 text-slate-500"
                              }`}
                            >
                              <strong className="block text-[10px]">Session {s.sessionNumber}</strong>
                              <span className="text-[9px] mt-1 font-medium">{s.status}</span>
                            </div>
                          ))}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVOICE LEDGERS */}
          {activeTab === "billing" && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 border-b border-slate-850 pb-3">My Invoices Ledger</h3>

              {chart.invoices.length === 0 ? (
                <p className="text-slate-550 text-xs py-4 italic text-center">No invoices found.</p>
              ) : (
                <div className="divide-y divide-slate-850">
                  {chart.invoices.map((inv: any) => {
                    const paidAmt = inv.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
                    return (
                      <div key={inv.id} className="py-4.5 flex justify-between items-center text-xs hover:bg-slate-855/10 px-2 rounded-lg transition-all">
                        <div>
                          <span className="text-[10px] text-slate-550 block">{new Date(inv.date).toLocaleDateString("en-IN")}</span>
                          <strong className="text-slate-200 mt-1 block">{inv.invoiceNumber}</strong>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase mt-1.5 inline-block ${
                            inv.status === "PAID" ? "bg-emerald-950/40 border border-emerald-900/30 text-emerald-450" :
                            inv.status === "PARTIALLY_PAID" ? "bg-amber-955/35 border border-amber-900/35 text-amber-500" :
                            "bg-slate-800 text-slate-400"
                          }`}>
                            {inv.status}
                          </span>
                        </div>

                        <div className="text-right flex items-center gap-4">
                          <div>
                            <span className="font-bold text-white block">Payable: {globalSettings.currency} {inv.totalAmount.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">Paid: {globalSettings.currency} {paidAmt.toLocaleString()}</span>
                          </div>
                          <button
                            onClick={() => loadInvoicePrint(inv.id)}
                            className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750 rounded-lg cursor-pointer"
                          >
                            <Printer className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BOOK SLOT */}
          {activeTab === "book" && (
            <form onSubmit={handleSelfBook} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-455" /> Book Consultation Appointment
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Select Clinic Branch *</label>
                  <select required value={appForm.clinicId} onChange={(e) => setAppForm({ ...appForm, clinicId: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2.5 text-slate-101">
                    <option value="">-- Choose Branch --</option>
                    {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Select Specialist Doctor *</label>
                  <select required value={appForm.doctorId} onChange={(e) => setAppForm({ ...appForm, doctorId: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2.5 text-slate-101">
                    <option value="">-- Choose Doctor --</option>
                    {doctors.filter(d => d.status === "ACTIVE").map(d => <option key={d.id} value={d.id}>{d.name} ({d.specializations})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-455 mb-1">Appointment Slot Time *</label>
                  <input type="datetime-local" required value={appForm.appointmentDate} onChange={(e) => setAppForm({ ...appForm, appointmentDate: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2.5 text-slate-101" />
                </div>

                <div>
                  <label className="block text-slate-455 mb-1">Visit Nature *</label>
                  <select value={appForm.type} onChange={(e) => setAppForm({ ...appForm, type: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2.5 text-slate-101">
                    <option value="CONSULTATION">First Consult Visit</option>
                    <option value="FOLLOW_UP">Follow-Up Checkup</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-455 mb-1">Notes for Clinic Desk</label>
                  <input type="text" value={appForm.notes} onChange={(e) => setAppForm({ ...appForm, notes: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2.5 text-slate-105" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-955 rounded">
                Confirm Booked Slot
              </button>
            </form>
          )}

          {/* PRINTABLE RX MODAL */}
          {selectedRx && (
            <div className="bg-white text-slate-900 border border-slate-350 p-8 rounded-xl shadow-xl space-y-6 max-w-2xl mx-auto font-serif relative z-30 animate-fadeIn">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h1 className="text-base font-bold text-slate-900 uppercase font-sans">Dr. {selectedRx.consultation.doctor.name}</h1>
                  <p className="text-[10px] text-slate-500 font-sans">Reg No: {selectedRx.consultation.doctor.regNumber} ({selectedRx.consultation.doctor.issuingCouncil})</p>
                </div>
                <div className="text-right text-[10px] text-slate-550 font-sans">
                  <h2 className="font-bold text-slate-800">{selectedRx.consultation.doctor.clinic.name}</h2>
                  <p>{selectedRx.consultation.doctor.clinic.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs py-2 bg-slate-50 border p-3 rounded font-sans">
                <div>Patient: <strong>{selectedRx.consultation.patient.name}</strong><br />MRN: {selectedRx.consultation.patient.mrn}</div>
                <div className="text-right">Date: {new Date(selectedRx.date).toLocaleDateString("en-IN")}<br />Diag: {selectedRx.consultation.provisionalDiagnosis}</div>
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-800 block mb-2 font-sans">Rx Medication Instructions</span>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b font-bold bg-slate-50 font-sans text-slate-700">
                      <th className="py-1 px-1">Medicine</th>
                      <th className="py-1 px-1 text-center">Dosage</th>
                      <th className="py-1 px-1 text-center">Frequency</th>
                      <th className="py-1 px-1 text-center">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRx.items.map((it: any) => (
                      <tr key={it.id} className="border-b border-slate-100">
                        <td className="py-2 px-1"><strong>{it.medicineName}</strong></td>
                        <td className="py-2 px-1 text-center">{it.dosage}</td>
                        <td className="py-2 px-1 text-center">{it.frequency}</td>
                        <td className="py-2 px-1 text-center">{it.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedRx.consultation.doctor.signatureUrl && (
                <div className="flex flex-col items-end pt-6 font-sans">
                  <div className="text-[10px] text-slate-450 italic">Electronically Signed by:</div>
                  <strong className="text-xs mt-1 text-slate-800">{selectedRx.consultation.doctor.signatureUrl}</strong>
                </div>
              )}

              <div className="text-center pt-2 print:hidden">
                <button onClick={() => window.print()} className="py-1 px-4 bg-slate-850 text-white rounded text-xs font-sans">Print prescription</button>
              </div>
            </div>
          )}

          {/* PRINTABLE INVOICE MODAL */}
          {selectedInvoice && (
            <div className="bg-white text-slate-900 border border-slate-350 p-8 rounded-xl shadow-xl space-y-6 max-w-2xl mx-auto font-serif relative z-30 animate-fadeIn">
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h1 className="text-base font-bold uppercase">{selectedInvoice.billingEntity.legalName}</h1>
                  <p className="text-[10px] text-slate-500 mt-1">{selectedInvoice.billingEntity.address}</p>
                </div>
                <div className="text-right text-[10px]">
                  <span className="font-bold block text-slate-700 uppercase font-sans">TAX RECEIPT</span>
                  <span>Inv No: {selectedInvoice.invoiceNumber}</span>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b font-bold bg-slate-50 text-slate-850 font-sans">
                    <th className="py-2 px-3">Item Details</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Price</th>
                    <th className="py-2 px-3 text-right font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((it: any) => (
                    <tr key={it.id} className="border-b border-slate-100">
                      <td className="py-2.5 px-3"><strong>{it.description}</strong></td>
                      <td className="py-2.5 px-3 text-center">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right">{globalSettings.currency} {it.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-bold">₹{(it.quantity * it.unitPrice - it.discountAmount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex flex-col items-end text-xs space-y-1 font-sans">
                <div>Invoice Total: <strong>{globalSettings.currency} {selectedInvoice.totalAmount.toFixed(2)}</strong></div>
              </div>

              <div className="text-center pt-2 print:hidden font-sans">
                <button onClick={() => window.print()} className="py-1 px-4 bg-slate-850 text-white rounded text-xs">Print invoice</button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default function PatientPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Patient Dashboard...</div>}>
      <PatientDashboardContent />
    </Suspense>
  );
}
