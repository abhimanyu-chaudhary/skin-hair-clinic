"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  FileText,
  Plus,
  Trash2,
  Lock,
  ChevronRight,
  TrendingUp,
  Calendar,
} from "lucide-react";

function DoctorDashboardContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("queue");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Stats & Queue
  const [stats, setStats] = useState({ queueSize: 0, completedToday: 0, followUpsToday: 0 });
  const [queue, setQueue] = useState<any[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const [patientHistory, setPatientHistory] = useState<any>(null);

  // Global settings for dynamic currency
  const [globalSettings, setGlobalSettings] = useState<any>({
    currency: "NPR",
  });

  // Doctor profile details
  const [doctorProfile, setDoctorProfile] = useState<any>(null);

  // Masters
  const [treatments, setTreatments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // EMR Form State
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [duration, setDuration] = useState("2 weeks");
  const [onsetTriggers, setOnsetTriggers] = useState("Stress/Hormonal");
  
  const [allergies, setAllergies] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  
  // Scales
  const [acneGrade, setAcneGrade] = useState("NONE");
  const [norwoodScale, setNorwoodScale] = useState("NONE");
  const [skinType, setSkinType] = useState("Combination");
  const [scalpCondition, setScalpCondition] = useState("Normal");

  // Advises & Lines
  const [advisedTests, setAdvisedTests] = useState<string[]>([]);
  const [advisedTestInput, setAdvisedTestInput] = useState("");
  
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([]);
  
  const [adviseTreatment, setAdviseTreatment] = useState(false);
  const [advisedTreatmentId, setAdvisedTreatmentId] = useState("");
  const [advisedSessions, setAdvisedSessions] = useState("4");
  const [advisedPrice, setAdvisedPrice] = useState("0");
  const [consentName, setConsentName] = useState("");
  const [consentSignature, setConsentSignature] = useState("");

  const [followUpDays, setFollowUpDays] = useState("14");

  // Availability Settings Form
  const [availabilityForm, setAvailabilityForm] = useState({
    consultFee: "800",
    followUpFee: "400",
    slotDuration: "15",
    status: "ACTIVE",
    signatureUrl: "",
  });

  // Password reset state
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (passwordForm.newPassword.length < 5) {
      setErrorMsg("Password must be at least 5 characters long.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) throw new Error("Could not verify session.");
      const meData = await meRes.json();
      const userId = meData.user.id;

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, newPassword: passwordForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setSuccessMsg("Your login password has been changed successfully!");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  // Sync activeTab with URL params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
      setErrorMsg("");
      setSuccessMsg("");
      setActiveConsultation(null);
    }
  }, [searchParams]);

  // Fetch basic config, queue and settings
  useEffect(() => {
    fetchStats();
    fetchQueue();
    loadMasters();
    loadDoctorProfile();
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

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/emr/queue");
      if (res.ok) setQueue(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadMasters = async () => {
    try {
      const [resT, resP] = await Promise.all([
        fetch("/api/treatments"),
        fetch("/api/products"),
      ]);
      if (resT.ok) setTreatments(await resT.json());
      if (resP.ok) setProducts(await resP.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadDoctorProfile = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        const docId = meData.user.profileId;
        if (docId) {
          const docListRes = await fetch("/api/doctors");
          if (docListRes.ok) {
            const list = await docListRes.json();
            const profile = list.find((d: any) => d.id === docId);
            if (profile) {
              setDoctorProfile(profile);
              setAvailabilityForm({
                consultFee: profile.consultFee.toString(),
                followUpFee: profile.followUpFee.toString(),
                slotDuration: profile.slotDuration.toString(),
                status: profile.status,
                signatureUrl: profile.signatureUrl || "",
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to load doctor profile info", err);
    }
  };

  // Open consultation EMR sheet
  const handleOpenConsultation = async (app: any) => {
    setSuccessMsg("");
    setErrorMsg("");
    setActiveConsultation(app);
    setLoading(true);

    try {
      const res = await fetch(`/api/patients/${app.patientId}`);
      if (res.ok) {
        const historyData = await res.json();
        setPatientHistory(historyData);
        setAllergies(historyData.allergies || "");
        setChronicConditions(historyData.chronicConditions || "");
      }
    } catch (err) {
      setErrorMsg("Failed to load patient history timeline");
    } finally {
      setLoading(false);
    }
  };

  // Prescription builders
  const addRxProductLine = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    setPrescriptionItems([
      ...prescriptionItems,
      {
        medicineName: prod.name,
        dosage: "1 application",
        frequency: "1-0-1",
        duration: "4 weeks",
        quantity: 1,
        route: "TOPICAL",
        instructions: "Apply thin layer on dry scalp at night.",
        productId: prod.id,
      },
    ]);
  };

  const addRxManualLine = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      {
        medicineName: "",
        dosage: "1 tablet",
        frequency: "1-0-0",
        duration: "10 days",
        quantity: 10,
        route: "ORAL",
        instructions: "Take after meals with warm water.",
        productId: null,
      },
    ]);
  };

  const removeRxLine = (idx: number) => {
    const copy = [...prescriptionItems];
    copy.splice(idx, 1);
    setPrescriptionItems(copy);
  };

  // Add diagnostic tests
  const addAdvisedTest = () => {
    if (advisedTestInput.trim()) {
      setAdvisedTests([...advisedTests, advisedTestInput.trim()]);
      setAdvisedTestInput("");
    }
  };

  const removeAdvisedTest = (idx: number) => {
    const copy = [...advisedTests];
    copy.splice(idx, 1);
    setAdvisedTests(copy);
  };

  const handleTreatmentChange = (tId: string) => {
    setAdvisedTreatmentId(tId);
    const tr = treatments.find((t) => t.id === tId);
    if (tr) setAdvisedPrice(tr.basePrice.toString());
  };

  // Finalize EMR & Lock
  const handleFinalizeConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    const medicalHistory = {
      allergies,
      chronicConditions,
      pastIllness: patientHistory?.currentMedications || "None",
    };

    const examinationFindings = {
      acneGrade,
      norwoodScale,
      skinType,
      scalpCondition,
      findingsDetail: provisionalDiagnosis,
    };

    const treatmentAdvised = adviseTreatment && advisedTreatmentId
      ? {
          treatmentCatalogId: advisedTreatmentId,
          totalSessions: parseInt(advisedSessions, 10),
          totalPrice: parseFloat(advisedPrice),
          consentSigned: !!consentSignature,
          consentName,
          consentSignature,
        }
      : null;

    try {
      const res = await fetch("/api/emr/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: activeConsultation.id,
          chiefComplaint,
          duration,
          onsetTriggers,
          medicalHistory,
          examinationFindings,
          provisionalDiagnosis,
          privateNotes,
          investigations: advisedTests,
          prescriptionItems,
          treatmentAdvised,
          followUpDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "EMR finalization failed");

      setSuccessMsg("EMR Consultation finalized and locked successfully!");
      setActiveConsultation(null);
      setPatientHistory(null);
      setChiefComplaint("");
      setProvisionalDiagnosis("");
      setPrivateNotes("");
      setPrescriptionItems([]);
      setAdvisedTests([]);
      setAdviseTreatment(false);
      setAdvisedTreatmentId("");

      fetchQueue();
      fetchStats();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to finalize consultation");
    } finally {
      setLoading(false);
    }
  };

  // Submit Doctor Availability Updates
  const handleUpdateAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!doctorProfile) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/doctors/${doctorProfile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(availabilityForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update availability");

      setSuccessMsg("Availability roster updated successfully!");
      loadDoctorProfile();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Roster Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Today's Queue Size</span>
            <h4 className="text-xl font-bold text-sky-400 mt-1">{queue.filter(q => q.status === "ARRIVED").length} Waiting</h4>
          </div>
          <div className="p-3 bg-sky-955/40 border border-sky-900/35 text-sky-400 rounded-lg">
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Completed Today</span>
            <h4 className="text-xl font-bold text-emerald-400 mt-1">{queue.filter(q => q.status === "COMPLETED").length} Visits</h4>
          </div>
          <div className="p-3 bg-emerald-955/40 border border-emerald-900/35 text-emerald-400 rounded-lg">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Allocated</span>
            <h4 className="text-xl font-bold text-amber-500 mt-1">{queue.length} Roster Patients</h4>
          </div>
          <div className="p-3 bg-amber-955/40 border border-amber-900/35 text-amber-500 rounded-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-1">
        {[
          { id: "queue", label: "Consultation Queue", icon: ClipboardList },
          { id: "schedule", label: "Roster & Availability", icon: Calendar },
          { id: "security", label: "Security Settings", icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setErrorMsg("");
                setSuccessMsg("");
                setActiveConsultation(null);
              }}
              className={`py-3 px-5 text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? "border-emerald-500 text-emerald-455 bg-slate-900/20"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-955/30 border border-emerald-800/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-955/20 border border-rose-900/35 text-rose-355 rounded-xl text-xs flex items-center gap-2.5 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-rose-455 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab: CONSULTATION QUEUE */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          {!activeConsultation ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Roster Rota and Patient Queue</h2>
                  <p className="text-xs text-slate-455 mt-1">See your complete schedule (Today's check-ins, follow-ups, and bookings).</p>
                </div>
                <button onClick={fetchQueue} className="py-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 border border-slate-755 rounded-lg cursor-pointer">
                  Refresh List
                </button>
              </div>

              {queue.length === 0 ? (
                <p className="text-slate-550 text-xs py-8 text-center bg-slate-955/10 border border-dashed border-slate-850 rounded-lg">
                  No appointments scheduled.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 animate-fadeIn">
                  {queue.map((app) => (
                    <div key={app.id} className="p-4 bg-slate-955 border border-slate-850 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-750 transition-all">
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            app.status === "ARRIVED" ? "bg-sky-955 border border-sky-900/30 text-sky-400" :
                            app.status === "BOOKED" ? "bg-slate-850 text-slate-400" :
                            app.status === "COMPLETED" ? "bg-emerald-955 border border-emerald-900/30 text-emerald-450" :
                            "bg-purple-955/20 border border-purple-900/30 text-purple-400"
                          }`}>
                            {app.status}
                          </span>
                          <h3 className="text-xs font-bold text-white">{app.patient.name}</h3>
                          <span className="text-[10px] text-slate-450">MRN: <strong className="text-emerald-455">{app.patient.mrn}</strong></span>
                        </div>

                        <div className="text-[11px] text-slate-450 space-y-1">
                          <div>
                            Age: <strong className="text-slate-300">{new Date().getFullYear() - new Date(app.patient.dob).getFullYear()} yrs</strong> • Gender: <strong className="text-slate-300">{app.patient.gender}</strong> • Phone: <span className="text-slate-350">{app.patient.mobile}</span>
                          </div>
                          <div>
                            Allergies: <span className="text-rose-455 font-bold">{app.patient.allergies || "None"}</span> • Chronic Conditions: <span className="text-amber-500 font-semibold">{app.patient.chronicConditions || "None"}</span>
                          </div>
                          {app.notes && <div className="text-[10px] italic text-slate-500">Note: "{app.notes}"</div>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-none border-slate-855 pt-2.5 md:pt-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Scheduled Roster Time</span>
                          <strong className="text-xs text-white block">{new Date(app.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                        </div>

                        {app.status !== "COMPLETED" && (
                          <button
                            onClick={() => handleOpenConsultation(app)}
                            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-955 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-md"
                          >
                            Open EMR Sheet <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fadeIn">
              
              {/* LEFT PANEL: History chart */}
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-6 max-h-[800px] overflow-y-auto">
                <div className="border-b border-slate-850 pb-4">
                  <span className="text-[9px] text-emerald-450 font-bold uppercase tracking-wider block mb-1">Active Patient Chart</span>
                  <h2 className="text-base font-bold text-white">{activeConsultation.patient.name}</h2>
                  <p className="text-xs text-slate-400 mt-1">MRN: <strong>{activeConsultation.patient.mrn}</strong></p>
                </div>

                <div className="space-y-2 text-xs text-slate-450 border border-slate-850 p-4 rounded bg-slate-955/20">
                  <div className="flex justify-between">
                    <span>Allergies:</span>
                    <strong className="text-rose-455 font-bold">{allergies || "None"}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Chronic Conditions:</span>
                    <strong className="text-amber-500 font-semibold">{chronicConditions || "None"}</strong>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Longitudinal Case Timeline</h3>
                  {patientHistory?.consultations.length === 0 ? (
                    <p className="text-slate-550 text-xs italic">First visit. No past consultation records found.</p>
                  ) : (
                    <div className="space-y-4 pl-5 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800">
                      {patientHistory?.consultations.map((c: any) => (
                        <div key={c.id} className="relative space-y-1">
                          <span className="absolute left-[-21px] top-1.5 h-2 w-2 bg-slate-700 rounded-full" />
                          <div className="text-[9px] text-slate-500 font-bold">{new Date(c.date).toLocaleDateString("en-IN")}</div>
                          <div className="text-xs font-bold text-slate-200">{c.provisionalDiagnosis}</div>
                          <p className="text-xs text-slate-455 italic">"{c.chiefComplaint}"</p>
                          {c.prescription && (
                            <div className="p-2 bg-slate-955 border border-slate-850 rounded text-[9px] text-emerald-450 font-mono">
                              {c.prescription.items.map((it: any) => (
                                <div key={it.id}>Rx: {it.medicineName} ({it.dosage} • {it.frequency})</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT PANEL: EMR Sheet */}
              <form onSubmit={handleFinalizeConsultation} className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-6">
                <div className="border-b border-slate-850 pb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-400" /> OP Consultation EMR Roster
                    </h2>
                    <p className="text-xs text-slate-455 mt-1">Fill complaints, scales, orders, templates, and lock EMR.</p>
                  </div>
                  <button type="button" onClick={() => setActiveConsultation(null)} className="text-xs text-rose-455 font-bold hover:underline">
                    Cancel Session
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-1">Chief Symptom / Complaint *</label>
                    <input
                      type="text"
                      required
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="e.g. Hair fall recession at crown"
                      className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Duration *</label>
                    <input
                      type="text"
                      required
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101"
                    />
                  </div>
                </div>

                {/* scales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-slate-850 pt-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Acne Grade</label>
                    <select value={acneGrade} onChange={(e) => setAcneGrade(e.target.value)} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-101">
                      <option value="NONE">None</option>
                      <option value="GRADE_1">Grade 1</option>
                      <option value="GRADE_2">Grade 2</option>
                      <option value="GRADE_3">Grade 3</option>
                      <option value="GRADE_4">Grade 4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Norwood Baldness</label>
                    <select value={norwoodScale} onChange={(e) => setNorwoodScale(e.target.value)} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-101">
                      <option value="NONE">None</option>
                      <option value="STAGE_I">Stage I</option>
                      <option value="STAGE_II">Stage II</option>
                      <option value="STAGE_III">Stage III</option>
                      <option value="STAGE_IV">Stage IV</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Skin Type</label>
                    <input type="text" value={skinType} onChange={(e) => setSkinType(e.target.value)} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-101" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Scalp Condition</label>
                    <input type="text" value={scalpCondition} onChange={(e) => setScalpCondition(e.target.value)} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-101" />
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-4">
                  <label className="block text-[10px] text-slate-400 mb-1">Provisional Diagnosis *</label>
                  <input
                    type="text"
                    required
                    value={provisionalDiagnosis}
                    onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101"
                  />
                </div>

                {/* Prescription */}
                <div className="border-t border-slate-850 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-350">Prescription (Rx) Lines</h4>
                    <div className="flex gap-2">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            addRxProductLine(e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="bg-slate-955 border border-slate-800 rounded px-2 py-1 text-xs text-slate-400"
                      >
                        <option value="">+ Stocked Product SKU</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.sku} • {p.name}</option>)}
                      </select>
                      <button type="button" onClick={addRxManualLine} className="py-1 px-2.5 bg-slate-800 hover:bg-slate-750 text-xs font-bold border border-slate-700 rounded transition-all">
                        + Add Manual Rx
                      </button>
                    </div>
                  </div>

                  {prescriptionItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-955 p-3 rounded border border-slate-850 animate-fadeIn">
                      <input
                        type="text"
                        required
                        placeholder="Medicine brand name"
                        value={item.medicineName}
                        onChange={(e) => {
                          const copy = [...prescriptionItems];
                          copy[idx].medicineName = e.target.value;
                          setPrescriptionItems(copy);
                        }}
                        className="col-span-4 bg-slate-955 border border-slate-800 rounded px-2 py-1 text-xs text-slate-101"
                      />
                      <input
                        type="text"
                        placeholder="Dosage"
                        value={item.dosage}
                        onChange={(e) => {
                          const copy = [...prescriptionItems];
                          copy[idx].dosage = e.target.value;
                          setPrescriptionItems(copy);
                        }}
                        className="col-span-2 bg-slate-955 border border-slate-800 rounded px-2 py-1 text-xs text-slate-101"
                      />
                      <input
                        type="text"
                        placeholder="Frequency (e.g. 1-0-1)"
                        value={item.frequency}
                        onChange={(e) => {
                          const copy = [...prescriptionItems];
                          copy[idx].frequency = e.target.value;
                          setPrescriptionItems(copy);
                        }}
                        className="col-span-2 bg-slate-955 border border-slate-800 rounded px-2 py-1 text-xs text-slate-101"
                      />
                      <input
                        type="text"
                        placeholder="Duration"
                        value={item.duration}
                        onChange={(e) => {
                          const copy = [...prescriptionItems];
                          copy[idx].duration = e.target.value;
                          setPrescriptionItems(copy);
                        }}
                        className="col-span-2 bg-slate-955 border border-slate-800 rounded px-2 py-1 text-xs text-slate-101"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const copy = [...prescriptionItems];
                          copy[idx].quantity = e.target.value;
                          setPrescriptionItems(copy);
                        }}
                        className="col-span-1 bg-slate-955 border border-slate-800 rounded px-2 py-1 text-xs text-slate-101"
                      />
                      <div className="col-span-1 text-right">
                        <button type="button" onClick={() => removeRxLine(idx)} className="text-rose-455 hover:text-rose-350">×</button>
                      </div>
                      <input
                        type="text"
                        value={item.instructions || ""}
                        onChange={(e) => {
                          const copy = [...prescriptionItems];
                          copy[idx].instructions = e.target.value;
                          setPrescriptionItems(copy);
                        }}
                        placeholder="Usage Instructions"
                        className="col-span-12 mt-1 bg-slate-955 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-400 placeholder-slate-655"
                      />
                    </div>
                  ))}
                </div>

                {/* Propose Treatment Packages */}
                <div className="border-t border-slate-850 pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="proposeTr" checked={adviseTreatment} onChange={(e) => setAdviseTreatment(e.target.checked)} className="rounded text-emerald-500 bg-slate-955 border-slate-800" />
                    <label htmlFor="proposeTr" className="text-xs font-bold uppercase tracking-wider text-slate-350 cursor-pointer">Propose Treatment Plan package</label>
                  </div>
                  
                  {adviseTreatment && (
                    <div className="grid grid-cols-3 gap-3 p-3 bg-slate-955 border border-slate-850 rounded">
                      <div className="col-span-3">
                        <label className="block text-[9px] text-slate-450 mb-0.5">Select Treatment *</label>
                        <select required value={advisedTreatmentId} onChange={(e) => handleTreatmentChange(e.target.value)} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-101">
                          <option value="">-- Choose Treatment --</option>
                          {treatments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-455 mb-0.5">Sessions Count</label>
                        <input type="number" value={advisedSessions} onChange={(e) => setAdvisedSessions(e.target.value)} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-xs text-slate-101" />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-455 mb-0.5">Proposed Total Price ({globalSettings.currency})</label>
                        <input type="number" value={advisedPrice} onChange={(e) => setAdvisedPrice(e.target.value)} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-xs text-slate-101" />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-455 mb-0.5">Consent Sign Name</label>
                        <input type="text" value={consentName} onChange={(e) => setConsentName(e.target.value)} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-xs text-slate-101" />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[9px] text-slate-455 mb-0.5">Patient Typed Signature</label>
                        <input type="text" value={consentSignature} onChange={(e) => setConsentSignature(e.target.value)} placeholder="/s/ John Doe" className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-xs text-slate-101" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-850 pt-4 flex justify-between items-center text-xs">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1.5"><Lock className="h-4 w-4 text-emerald-500" /> Permanent EMR lock</span>
                  <button type="submit" disabled={loading} className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-slate-955 font-bold rounded shadow-lg">
                    {loading ? "Locking..." : "Finalize & Permanently Lock EMR"}
                  </button>
                </div>
              </form>

            </div>
          )}
        </div>
      )}

      {/* TAB: ROSTER & AVAILABILITY */}
      {activeTab === "schedule" && doctorProfile && (
        <form onSubmit={handleUpdateAvailability} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-6 animate-fadeIn">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-450" /> Clinic Roster & Rota settings
            </h2>
            <p className="text-xs text-slate-455 mt-1">Configure consult fees, roster slots duration, leave statuses, and weekly shifts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4 bg-slate-950/20 border border-slate-855 p-5 rounded-lg">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350">Configure Fees & Durations</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">First Visit Consult Fee ({globalSettings.currency}) *</label>
                  <input
                    type="number"
                    required
                    value={availabilityForm.consultFee}
                    onChange={(e) => setAvailabilityForm({ ...availabilityForm, consultFee: e.target.value })}
                    className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-slate-101 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Follow-Up Fee ({globalSettings.currency}) *</label>
                  <input
                    type="number"
                    required
                    value={availabilityForm.followUpFee}
                    onChange={(e) => setAvailabilityForm({ ...availabilityForm, followUpFee: e.target.value })}
                    className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-slate-101 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Roster Slot Duration (Mins) *</label>
                  <select
                    value={availabilityForm.slotDuration}
                    onChange={(e) => setAvailabilityForm({ ...availabilityForm, slotDuration: e.target.value })}
                    className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-slate-101 font-medium"
                  >
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Roster Active Status *</label>
                  <select
                    value={availabilityForm.status}
                    onChange={(e) => setAvailabilityForm({ ...availabilityForm, status: e.target.value })}
                    className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-slate-101 font-medium"
                  >
                    <option value="ACTIVE">ACTIVE (Accept bookings)</option>
                    <option value="INACTIVE">INACTIVE (Deactivate account)</option>
                    <option value="ON_LEAVE">ON LEAVE (Temporary block)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Digital Signature Image Url / Text</label>
                <input
                  type="text"
                  value={availabilityForm.signatureUrl}
                  onChange={(e) => setAvailabilityForm({ ...availabilityForm, signatureUrl: e.target.value })}
                  placeholder="e.g. Dr. Ananya / NMC 12345"
                  className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-slate-101"
                />
              </div>

              <button type="submit" disabled={loading} className="py-2.5 px-4.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-955 rounded transition-all cursor-pointer">
                {loading ? "Saving settings..." : "Save Availability Settings"}
              </button>
            </div>

            <div className="space-y-4 bg-slate-950/20 border border-slate-850 p-5 rounded-lg font-sans">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 font-mono">Doctor Credentials Details</h3>
              <div className="space-y-2.5 text-slate-450 leading-relaxed text-xs">
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span>Qualifications:</span>
                  <strong className="text-white">{doctorProfile.qualifications}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span>Specializations:</span>
                  <strong className="text-white">{doctorProfile.specializations}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span>License Reg Number:</span>
                  <strong className="text-white">{doctorProfile.regNumber}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span>Issuing Council:</span>
                  <strong className="text-white">{doctorProfile.issuingCouncil}</strong>
                </div>
                <div className="flex justify-between pb-1.5">
                  <span>Years of Experience:</span>
                  <strong className="text-white">{doctorProfile.experienceYrs} yrs</strong>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Tab: SECURITY SETTINGS */}
      {activeTab === "security" && (
        <form onSubmit={handleUpdatePassword} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md max-w-md mx-auto space-y-4 animate-fadeIn">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-455" /> Change Password
          </h3>
          <p className="text-[11px] text-slate-455">Update your personal account credentials below. Choose a secure, unique password.</p>
          
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">New Password *</label>
            <input
              type="password"
              required
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="Min 5 characters"
              className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101 font-mono"
            />
          </div>
          
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="Repeat password"
              className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101 font-mono"
            />
          </div>
          
          <button type="submit" disabled={loading} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-950 rounded transition-all cursor-pointer text-xs">
            Change Password
          </button>
        </form>
      )}

    </div>
  );
}

export default function DoctorPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Doctor Rota and Queue...</div>}>
      <DoctorDashboardContent />
    </Suspense>
  );
}
