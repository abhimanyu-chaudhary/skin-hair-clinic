"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  TrendingUp,
  Building,
  Users,
  Layers,
  ArrowRight,
  Activity,
  BarChart,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Plus,
  User,
  Edit3,
  Lock,
  Trash2,
} from "lucide-react";

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("analytics");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Editing States
  const [isEditingClinic, setIsEditingClinic] = useState<string | null>(null);
  const [isEditingDoctor, setIsEditingDoctor] = useState<string | null>(null);
  const [isEditingBilling, setIsEditingBilling] = useState<string | null>(null);
  const [isEditingStaff, setIsEditingStaff] = useState<string | null>(null);
  const [isEditingTreatment, setIsEditingTreatment] = useState<string | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState<string | null>(null);

  // Global Settings State
  const [globalSettingsForm, setGlobalSettingsForm] = useState({
    businessName: "Nepal Skin & Hair Clinic",
    taxType: "VAT",
    taxRate: 13,
    currency: "NPR",
    smsGateway: "Sparrow SMS",
    smsApiKey: "sparrow-sms-demo-key",
    smsSenderId: "SkinClinic",
    whatsappEnabled: true,
    telemedicineEnabled: true,
    abhaEnabled: false,
    citizenshipIdRequired: true,
    irdApprovedBilling: true,
    profilePassword: "admin123",
  });

  // Masters Data
  const [analytics, setAnalytics] = useState<any>({
    kpis: { totalRevenue: 0, totalPatients: 0, totalClinics: 0, totalAppointments: 0, inventoryValuation: 0 },
    revenuePerClinic: [],
    appointmentsPerDoctor: [],
  });
  const [clinics, setClinics] = useState<any[]>([]);
  const [billingEntities, setBillingEntities] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // 1. Clinic Form State
  const [clinicForm, setClinicForm] = useState({
    name: "",
    address: "",
    contactNumber: "",
    gstNumber: "",
    logoUrl: "",
    operatingHours: JSON.stringify({ weekdays: "09:00 AM - 08:00 PM", sunday: "10:00 AM - 04:00 PM" }),
    billingEntityId: "",
  });

  // 2. Doctor Form State
  const [doctorForm, setDoctorForm] = useState({
    email: "",
    password: "",
    clinicId: "",
    name: "",
    gender: "FEMALE",
    dob: "",
    mobile: "",
    regNumber: "",
    issuingCouncil: "",
    qualifications: "",
    specializations: "",
    experienceYrs: "5",
    consultFee: "800",
    followUpFee: "400",
    slotDuration: "15",
    signatureUrl: "",
  });

  // 3. Staff Form State
  const [staffForm, setStaffForm] = useState({
    email: "",
    password: "",
    name: "",
    mobile: "",
    clinicId: "",
  });
  const [staffPermissions, setStaffPermissions] = useState<string[]>([
    "register_patient",
    "book_appointment",
    "generate_invoice",
  ]);

  // 4. Billing Entity Form State
  const [billingForm, setBillingForm] = useState({
    legalName: "",
    address: "",
    gstin: "",
    pan: "",
    invoicePrefix: "AG-INV",
    bankDetails: "",
    terms: "1. Fees are non-refundable.\n2. Package sittings expire in 6 months.",
    logoUrl: "",
  });

  // 5. Treatment Catalog Form State
  const [treatmentForm, setTreatmentForm] = useState({
    name: "",
    category: "HAIR",
    description: "",
    basePrice: "3000",
  });

  // 6. Product Form State
  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    category: "MEDICINE",
    unit: "Bottle",
    purchasePrice: "200",
    sellingPrice: "400",
    taxRate: "12",
    reorderLevel: "10",
    supplier: "",
  });

  // Security Override State
  const [securityForm, setSecurityForm] = useState({
    deletionPassword: "",
    confirmDeletionPassword: "",
  });

  const [passwordResetForm, setPasswordResetForm] = useState({
    userType: "DOCTOR",
    selectedUserId: "",
    newPassword: "",
  });
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);

  // Sync tab active state with query parameters reactively
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
      setErrorMsg("");
      setSuccessMsg("");
      cancelEdits();
    }
  }, [searchParams]);

  // Load masters on activeTab update
  useEffect(() => {
    fetchAnalytics();
    loadMasters();
    fetchSettings();
  }, [activeTab]);

  const cancelEdits = () => {
    setIsEditingClinic(null);
    setIsEditingDoctor(null);
    setIsEditingBilling(null);
    setIsEditingStaff(null);
    setIsEditingTreatment(null);
    setIsEditingProduct(null);
    
    setClinicForm({
      name: "",
      address: "",
      contactNumber: "",
      gstNumber: "",
      logoUrl: "",
      operatingHours: JSON.stringify({ weekdays: "09:00 AM - 08:00 PM", sunday: "10:00 AM - 04:00 PM" }),
      billingEntityId: "",
    });
    setDoctorForm({
      email: "",
      password: "",
      clinicId: "",
      name: "",
      gender: "FEMALE",
      dob: "",
      mobile: "",
      regNumber: "",
      issuingCouncil: "",
      qualifications: "",
      specializations: "",
      experienceYrs: "5",
      consultFee: "800",
      followUpFee: "400",
      slotDuration: "15",
      signatureUrl: "",
    });
    setStaffForm({ email: "", password: "", name: "", mobile: "", clinicId: "" });
    setStaffPermissions(["register_patient", "book_appointment", "generate_invoice"]);
    setBillingForm({
      legalName: "",
      address: "",
      gstin: "",
      pan: "",
      invoicePrefix: "AG-INV",
      bankDetails: "",
      terms: "1. Fees are non-refundable.\n2. Package sittings expire in 6 months.",
      logoUrl: "",
    });
    setTreatmentForm({ name: "", category: "HAIR", description: "", basePrice: "3000" });
    setProductForm({
      sku: "",
      name: "",
      category: "MEDICINE",
      unit: "Bottle",
      purchasePrice: "200",
      sellingPrice: "400",
      taxRate: "12",
      reorderLevel: "10",
      supplier: "",
    });
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) setAnalytics(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setGlobalSettingsForm(data);
        setSecurityForm({
          deletionPassword: data.profilePassword || "admin123",
          confirmDeletionPassword: data.profilePassword || "admin123",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMasters = async () => {
    try {
      const [resC, resB, resD, resS, resT, resP] = await Promise.all([
        fetch("/api/clinics"),
        fetch("/api/billing-entities"),
        fetch("/api/doctors"),
        fetch("/api/staff"),
        fetch("/api/treatments"),
        fetch("/api/products"),
      ]);

      if (resC.ok) setClinics(await resC.json());
      if (resB.ok) setBillingEntities(await resB.json());
      if (resD.ok) setDoctors(await resD.json());
      if (resS.ok) setStaffs(await resS.json());
      if (resT.ok) setTreatments(await resT.json());
      if (resP.ok) setProducts(await resP.json());
    } catch (err) {
      console.error(err);
    }
  };

  // Search patients for password reset
  const handlePatientSearch = async (val: string) => {
    setPatientSearchQuery(val);
    if (val.length < 2) {
      setPatientSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/patients?search=${val}`);
      if (res.ok) {
        setPatientSearchResults(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Settings Update
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(globalSettingsForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      setSuccessMsg("Global configurations updated successfully!");
      fetchSettings();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Deletion Profile Password Change
  const handleSaveDeletionPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (securityForm.deletionPassword !== securityForm.confirmDeletionPassword) {
      setErrorMsg("Deletion passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...globalSettingsForm, profilePassword: securityForm.deletionPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update deletion password");

      setSuccessMsg("Global Deletion Profile Password updated successfully!");
      fetchSettings();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit User Password Reset
  const handleResetUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!passwordResetForm.selectedUserId || !passwordResetForm.newPassword) {
      setErrorMsg("Select a user and type the new password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: passwordResetForm.selectedUserId,
          newPassword: passwordResetForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset password override failed");

      setSuccessMsg(data.message || "Password reset successfully!");
      setPasswordResetForm({ ...passwordResetForm, selectedUserId: "", newPassword: "" });
      setPatientSearchQuery("");
      setPatientSearchResults([]);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Clinic Creation / Edit
  const handleClinicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const url = isEditingClinic ? `/api/clinics/${isEditingClinic}` : "/api/clinics";
      const method = isEditingClinic ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinicForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save clinic");

      setSuccessMsg(isEditingClinic ? "Clinic updated successfully!" : "Clinic branch registered!");
      cancelEdits();
      loadMasters();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Doctor Registration / Edit
  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const url = isEditingDoctor ? `/api/doctors/${isEditingDoctor}` : "/api/doctors";
      const method = isEditingDoctor ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctorForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save doctor details");

      setSuccessMsg(isEditingDoctor ? "Doctor details updated successfully!" : "Doctor profile registered successfully!");
      cancelEdits();
      loadMasters();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Staff Creation / Edit
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const url = isEditingStaff ? `/api/staff/${isEditingStaff}` : "/api/staff";
      const method = isEditingStaff ? "PATCH" : "POST";

      const payload = isEditingStaff
        ? {
            name: staffForm.name,
            mobile: staffForm.mobile,
            clinicId: staffForm.clinicId,
            permissions: staffPermissions,
          }
        : {
            ...staffForm,
            permissions: staffPermissions,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save staff profile");

      setSuccessMsg(isEditingStaff ? "Staff permissions updated!" : "New Staff user profile enabled successfully!");
      cancelEdits();
      loadMasters();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Billing Entity Creation / Edit
  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const url = "/api/billing-entities";
      const method = isEditingBilling ? "PATCH" : "POST";
      const payload = isEditingBilling ? { id: isEditingBilling, ...billingForm } : billingForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save billing entity");

      setSuccessMsg(isEditingBilling ? "Business Entity name and details updated!" : "Legal Entity registered!");
      cancelEdits();
      loadMasters();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Treatment Catalog Creation / Edit
  const handleTreatmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const url = isEditingTreatment ? `/api/treatments/${isEditingTreatment}` : "/api/treatments";
      const method = isEditingTreatment ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(treatmentForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save treatment catalog item");

      setSuccessMsg(isEditingTreatment ? "Treatment catalog item updated!" : "Treatment logged successfully!");
      cancelEdits();
      loadMasters();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Product SKU Creation / Edit
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const url = isEditingProduct ? `/api/products/${isEditingProduct}` : "/api/products";
      const method = isEditingProduct ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product SKU");

      setSuccessMsg(isEditingProduct ? "Product SKU master details updated!" : "Product SKU logged successfully!");
      cancelEdits();
      loadMasters();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Secure Delete with Deletion Password Check
  const handleDeleteWithPassword = async (type: string, id: string, deleteUrl: string) => {
    const password = prompt(`Security Verification: Enter the Global Deletion Profile Password to delete this ${type}:`);
    if (password === null) return; // user cancelled

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${deleteUrl}?password=${encodeURIComponent(password)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to delete ${type}`);

      setSuccessMsg(`${type} deleted successfully!`);
      loadMasters();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Standard Master Deletions (no password needed)
  const handleStandardDelete = async (type: string, id: string, deleteUrl: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(deleteUrl, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to delete ${type}`);

      setSuccessMsg(`${type} catalog record deleted!`);
      loadMasters();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Edit pre-fills
  const startEditClinic = (c: any) => {
    setIsEditingClinic(c.id);
    setClinicForm({
      name: c.name,
      address: c.address,
      contactNumber: c.contactNumber,
      gstNumber: c.gstNumber,
      logoUrl: c.logoUrl || "",
      operatingHours: c.operatingHours,
      billingEntityId: c.billingEntityId || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEditDoctor = (d: any) => {
    setIsEditingDoctor(d.id);
    setDoctorForm({
      email: d.user?.email || "",
      password: "",
      clinicId: d.clinicId,
      name: d.name,
      gender: d.gender,
      dob: d.dob ? d.dob.split("T")[0] : "",
      mobile: d.mobile,
      regNumber: d.regNumber,
      issuingCouncil: d.issuingCouncil,
      qualifications: d.qualifications,
      specializations: d.specializations,
      experienceYrs: d.experienceYrs.toString(),
      consultFee: d.consultFee.toString(),
      followUpFee: d.followUpFee.toString(),
      slotDuration: d.slotDuration.toString(),
      signatureUrl: d.signatureUrl || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEditStaff = (s: any) => {
    setIsEditingStaff(s.id);
    setStaffForm({
      email: s.user?.email || "",
      password: "",
      name: s.name,
      mobile: s.mobile,
      clinicId: s.clinicId,
    });
    try {
      setStaffPermissions(JSON.parse(s.permissions || "[]"));
    } catch {
      setStaffPermissions([]);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEditBilling = (be: any) => {
    setIsEditingBilling(be.id);
    setBillingForm({
      legalName: be.legalName,
      address: be.address,
      gstin: be.gstin,
      pan: be.pan,
      invoicePrefix: be.invoicePrefix,
      bankDetails: be.bankDetails,
      terms: be.terms,
      logoUrl: be.logoUrl || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEditTreatment = (tr: any) => {
    setIsEditingTreatment(tr.id);
    setTreatmentForm({
      name: tr.name,
      category: tr.category,
      description: tr.description || "",
      basePrice: tr.basePrice.toString(),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEditProduct = (pr: any) => {
    setIsEditingProduct(pr.id);
    setProductForm({
      sku: pr.sku,
      name: pr.name,
      category: pr.category,
      unit: pr.unit,
      purchasePrice: pr.purchasePrice.toString(),
      sellingPrice: pr.sellingPrice.toString(),
      taxRate: pr.taxRate.toString(),
      reorderLevel: pr.reorderLevel.toString(),
      supplier: pr.supplier || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePermissionCheckbox = (perm: string) => {
    if (staffPermissions.includes(perm)) {
      setStaffPermissions(staffPermissions.filter((p) => p !== perm));
    } else {
      setStaffPermissions([...staffPermissions, perm]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-1">
        {[
          { id: "analytics", label: "Analytics Overview", icon: TrendingUp },
          { id: "clinics", label: "Clinic Branches", icon: Building },
          { id: "doctors", label: "Roster Doctors", icon: Users },
          { id: "staff", label: "Manage Staff", icon: User },
          { id: "masters", label: "Masters Setup", icon: Layers },
          { id: "settings", label: "Global Settings", icon: ShieldCheck },
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
                cancelEdits();
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

      {/* Message alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-955/35 border border-emerald-800/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-955/20 border border-rose-900/35 text-rose-350 rounded-xl text-xs flex items-center gap-2 shadow-sm animate-fadeIn">
          <AlertTriangle className="h-5 w-5 text-rose-455 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Tab: ANALYTICS OVERVIEW */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gross Collections</span>
              <h4 className="text-lg font-bold text-emerald-400 mt-3">
                {globalSettingsForm.currency} {analytics.kpis.totalRevenue.toLocaleString()}
              </h4>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Patients</span>
              <h4 className="text-lg font-bold text-white mt-3">{analytics.kpis.totalPatients} MRNs</h4>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Clinic Branches</span>
              <h4 className="text-lg font-bold text-white mt-3">{analytics.kpis.totalClinics} Branches</h4>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Appointments</span>
              <h4 className="text-lg font-bold text-white mt-3">{analytics.kpis.totalAppointments} Visits</h4>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stock Assets Value</span>
              <h4 className="text-lg font-bold text-purple-400 mt-3">
                {globalSettingsForm.currency} {analytics.kpis.inventoryValuation.toLocaleString()}
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* 2. Tab: CLINIC BRANCHES */}
      {activeTab === "clinics" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          <form onSubmit={handleClinicSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md md:col-span-1 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-330 border-b border-slate-800 pb-2 flex items-center justify-between font-mono">
              <span>{isEditingClinic ? "Edit Clinic Details" : "Add Clinic Branch"}</span>
              {isEditingClinic && (
                <button type="button" onClick={cancelEdits} className="text-[10px] text-rose-455 hover:underline font-bold uppercase">
                  Cancel
                </button>
              )}
            </h3>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Branch Name *</label>
              <input type="text" required value={clinicForm.name} onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Address *</label>
              <input type="text" required value={clinicForm.address} onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Contact *</label>
                <input type="text" required value={clinicForm.contactNumber} onChange={(e) => setClinicForm({ ...clinicForm, contactNumber: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">TAX Reg No *</label>
                <input type="text" required value={clinicForm.gstNumber} onChange={(e) => setClinicForm({ ...clinicForm, gstNumber: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Link Billing Entity *</label>
              <select required value={clinicForm.billingEntityId} onChange={(e) => setClinicForm({ ...clinicForm, billingEntityId: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101">
                <option value="">-- Choose Biller Entity --</option>
                {billingEntities.map(e => <option key={e.id} value={e.id}>{e.legalName}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading} className="w-full py-2 bg-emerald-600 hover:bg-emerald-505 font-bold text-slate-955 text-xs rounded">
              {isEditingClinic ? "Update Branch Details" : "Save Clinic Branch"}
            </button>
          </form>

          {/* List Clinics */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md md:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 border-b border-slate-850 pb-2">Active Branches</h3>
            <div className="divide-y divide-slate-850">
              {clinics.map((c) => (
                <div key={c.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2">
                      {c.name}
                      <button onClick={() => startEditClinic(c)} className="p-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-emerald-450 border border-slate-750 rounded cursor-pointer" title="Edit Clinic">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteWithPassword("Clinic Branch", c.id, `/api/clinics/${c.id}`)} className="p-1 bg-slate-850 hover:bg-rose-950 text-rose-500 hover:text-rose-450 border border-slate-750 rounded cursor-pointer" title="Delete Clinic Branch">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </h4>
                    <p className="text-slate-500 text-[10px] mt-0.5">{c.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 bg-slate-850 border border-slate-800 rounded">
                      TAX Reg: {c.gstNumber}
                    </span>
                    <span className="text-[10px] text-emerald-450 block mt-1">Billed via: {c.billingEntity?.legalName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Tab: DOCTORS MANAGEMENT */}
      {activeTab === "doctors" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          <form onSubmit={handleDoctorSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md md:col-span-1 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center justify-between font-mono">
              <span>{isEditingDoctor ? "Edit Doctor Profile" : "Register Dermatologist"}</span>
              {isEditingDoctor && (
                <button type="button" onClick={cancelEdits} className="text-[10px] text-rose-455 hover:underline font-bold uppercase">
                  Cancel
                </button>
              )}
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="col-span-2">
                <label className="block text-[10px] text-slate-400 mb-0.5">Doctor Full Name *</label>
                <input type="text" required value={doctorForm.name} onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
              </div>

              {!isEditingDoctor && (
                <>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Email Login *</label>
                    <input type="email" required value={doctorForm.email} onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Roster Password *</label>
                    <input type="password" required value={doctorForm.password} onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Gender *</label>
                <select value={doctorForm.gender} onChange={(e) => setDoctorForm({ ...doctorForm, gender: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101">
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Date of Birth *</label>
                <input type="date" required value={doctorForm.dob} onChange={(e) => setDoctorForm({ ...doctorForm, dob: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] text-slate-400 mb-0.5">Mobile *</label>
                <input type="tel" required value={doctorForm.mobile} onChange={(e) => setDoctorForm({ ...doctorForm, mobile: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-slate-400 mb-0.5">Clinic Branch *</label>
                <select required value={doctorForm.clinicId} onChange={(e) => setDoctorForm({ ...doctorForm, clinicId: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101">
                  <option value="">-- Choose Branch --</option>
                  {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">NMC Reg No *</label>
                <input type="text" required value={doctorForm.regNumber} onChange={(e) => setDoctorForm({ ...doctorForm, regNumber: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Council *</label>
                <input type="text" required value={doctorForm.issuingCouncil} onChange={(e) => setDoctorForm({ ...doctorForm, issuingCouncil: e.target.value })} placeholder="NMC Nepal" className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] text-slate-400 mb-0.5">Qualifications *</label>
                <input type="text" required value={doctorForm.qualifications} onChange={(e) => setDoctorForm({ ...doctorForm, qualifications: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-slate-400 mb-0.5">Specializations *</label>
                <input type="text" required value={doctorForm.specializations} onChange={(e) => setDoctorForm({ ...doctorForm, specializations: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Exp Yrs</label>
                <input type="number" required value={doctorForm.experienceYrs} onChange={(e) => setDoctorForm({ ...doctorForm, experienceYrs: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Slot Dur (Min)</label>
                <input type="number" required value={doctorForm.slotDuration} onChange={(e) => setDoctorForm({ ...doctorForm, slotDuration: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Consult Fee *</label>
                <input type="number" required value={doctorForm.consultFee} onChange={(e) => setDoctorForm({ ...doctorForm, consultFee: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Follow-Up Fee</label>
                <input type="number" required value={doctorForm.followUpFee} onChange={(e) => setDoctorForm({ ...doctorForm, followUpFee: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-955 text-xs rounded transition-all">
              {isEditingDoctor ? "Update Doctor Profile" : "Register Specialist"}
            </button>
          </form>

          {/* List Doctors */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md md:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 border-b border-slate-850 pb-2">Roster Dermatologists</h3>
            <div className="divide-y divide-slate-850">
              {doctors.map((d) => (
                <div key={d.id} className="py-3.5 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2">
                      {d.name}
                      <button onClick={() => startEditDoctor(d)} className="p-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-emerald-455 border border-slate-750 rounded cursor-pointer" title="Edit Doctor Profile">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteWithPassword("Doctor", d.id, `/api/doctors/${d.id}`)} className="p-1 bg-slate-850 hover:bg-rose-950 text-rose-500 hover:text-rose-450 border border-slate-750 rounded cursor-pointer" title="Delete Doctor Profile">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </h4>
                    <p className="text-slate-550 text-[10px] mt-0.5">{d.qualifications} ({d.specializations})</p>
                    <p className="text-[10px] text-slate-455 mt-1">Branch: <strong>{d.clinic.name}</strong> • License: {d.regNumber} ({d.issuingCouncil})</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-emerald-950/45 border border-emerald-900/30 text-emerald-455 rounded-[4px] font-bold">
                      {d.status}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1.5 font-bold">{globalSettingsForm.currency} {d.consultFee}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Tab: STAFF MANAGEMENT */}
      {activeTab === "staff" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          <form onSubmit={handleStaffSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md md:col-span-1 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center justify-between font-mono">
              <span>{isEditingStaff ? "Edit Staff Account" : "Add Staff Account"}</span>
              {isEditingStaff && (
                <button type="button" onClick={cancelEdits} className="text-[10px] text-rose-455 hover:underline font-bold uppercase">
                  Cancel
                </button>
              )}
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Staff Member Name *</label>
                <input type="text" required value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101" />
              </div>

              {!isEditingStaff && (
                <>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Login Email *</label>
                    <input type="email" required value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Login Password *</label>
                    <input type="password" required value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Contact Mobile *</label>
                <input type="tel" required value={staffForm.mobile} onChange={(e) => setStaffForm({ ...staffForm, mobile: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Assign Base Clinic *</label>
                <select required value={staffForm.clinicId} onChange={(e) => setStaffForm({ ...staffForm, clinicId: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101">
                  <option value="">-- Choose Branch --</option>
                  {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2 border border-slate-855 p-4 rounded-lg bg-slate-955/35">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Staff Allowed Work Checkboxes</h4>
                {[
                  { key: "register_patient", label: "Register Patient & Edit Demographics" },
                  { key: "book_appointment", label: "Schedule Bookings & Check-In Queue" },
                  { key: "generate_invoice", label: "Create Invoices & Log Split Payments" },
                  { key: "manage_inventory", label: "Inventory Purchase Logs & Adjustments" },
                  { key: "add_treatment_catalog", label: "Add Treatment Catalog Packages" },
                  { key: "add_product_master", label: "Add Product SKU Masters" },
                ].map((perm) => (
                  <label key={perm.key} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={staffPermissions.includes(perm.key)}
                      onChange={() => handlePermissionCheckbox(perm.key)}
                      className="rounded text-emerald-500 bg-slate-955 border-slate-800"
                    />
                    <span>{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-550 font-bold text-slate-955 text-xs rounded transition-all">
              {isEditingStaff ? "Update Staff Account" : "Register Staff User"}
            </button>
          </form>

          {/* List Staffs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md md:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-355 border-b border-slate-850 pb-2">Active Staff Profiles</h3>
            <div className="divide-y divide-slate-850">
              {staffs.map((s) => {
                let permsArr = [];
                try { permsArr = JSON.parse(s.permissions || "[]"); } catch {}
                return (
                  <div key={s.id} className="py-3 flex justify-between items-start text-xs">
                    <div>
                      <h4 className="font-bold text-white flex items-center gap-2">
                        {s.name}
                        <button onClick={() => startEditStaff(s)} className="p-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-emerald-455 border border-slate-755 rounded cursor-pointer" title="Edit Staff Profile">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteWithPassword("Staff Account", s.id, `/api/staff/${s.id}`)} className="p-1 bg-slate-850 hover:bg-rose-950 text-rose-500 hover:text-rose-450 border border-slate-750 rounded cursor-pointer" title="Delete Staff Account">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </h4>
                      <p className="text-slate-500 text-[10px] mt-0.5 font-mono">Email: {s.user?.email}</p>
                      <p className="text-[10px] text-slate-450 mt-1">Branch: <strong>{s.clinic?.name}</strong> • Phone: {s.mobile}</p>
                    </div>
                    <div className="text-right max-w-xs space-y-1">
                      <div className="flex flex-wrap gap-1 justify-end">
                        {permsArr.map((p: string) => (
                          <span key={p} className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-slate-850 border border-slate-800 text-slate-400 whitespace-nowrap">
                            {p.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab: MASTERS SETUP */}
      {activeTab === "masters" && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create / Edit Billing Entity Form */}
            <form onSubmit={handleBillingSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center justify-between font-mono">
                <span>{isEditingBilling ? "Edit Legal Entity" : "Add Billing Entity"}</span>
                {isEditingBilling && (
                  <button type="button" onClick={cancelEdits} className="text-[10px] text-rose-455 hover:underline font-bold uppercase">
                    Cancel
                  </button>
                )}
              </h3>

              <div>
                <label className="block text-[9px] text-slate-400 mb-0.5">Legal Name *</label>
                <input type="text" required value={billingForm.legalName} onChange={(e) => setBillingForm({ ...billingForm, legalName: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-101" />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 mb-0.5">Registered Address *</label>
                <input type="text" required value={billingForm.address} onChange={(e) => setBillingForm({ ...billingForm, address: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-101" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-slate-400 mb-0.5">TAX Reg No *</label>
                  <input type="text" required value={billingForm.gstin} onChange={(e) => setBillingForm({ ...billingForm, gstin: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-101" />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-0.5">PAN Card No *</label>
                  <input type="text" required value={billingForm.pan} onChange={(e) => setBillingForm({ ...billingForm, pan: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-101" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-slate-400 mb-0.5">Invoice Prefix *</label>
                  <input type="text" required value={billingForm.invoicePrefix} onChange={(e) => setBillingForm({ ...billingForm, invoicePrefix: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-101" />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-0.5">Bank Details *</label>
                  <input type="text" required value={billingForm.bankDetails} onChange={(e) => setBillingForm({ ...billingForm, bankDetails: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-101" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-955 text-xs rounded">
                {isEditingBilling ? "Update Legal Biller" : "Save Entity"}
              </button>
            </form>

            {/* Create / Edit Treatment Catalog Form */}
            <form onSubmit={handleTreatmentSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center justify-between font-mono">
                <span>{isEditingTreatment ? "Edit Treatment" : "Add Treatment Catalog"}</span>
                {isEditingTreatment && (
                  <button type="button" onClick={cancelEdits} className="text-[10px] text-rose-455 hover:underline font-bold uppercase">
                    Cancel
                  </button>
                )}
              </h3>

              <div>
                <label className="block text-[9px] text-slate-400 mb-0.5">Treatment Name *</label>
                <input type="text" required value={treatmentForm.name} onChange={(e) => setTreatmentForm({ ...treatmentForm, name: e.target.value })} placeholder="PRP Hair therapy" className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-101" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-slate-400 mb-0.5">Category *</label>
                  <select value={treatmentForm.category} onChange={(e) => setTreatmentForm({ ...treatmentForm, category: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-101">
                    <option value="HAIR">HAIR</option>
                    <option value="SKIN">SKIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-0.5">Base Price ({globalSettingsForm.currency}) *</label>
                  <input type="number" required value={treatmentForm.basePrice} onChange={(e) => setTreatmentForm({ ...treatmentForm, basePrice: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-101" />
                </div>
              </div>

              <div>
                <label className="block text-[9px] text-slate-400 mb-0.5">Catalog Description</label>
                <textarea value={treatmentForm.description} onChange={(e) => setTreatmentForm({ ...treatmentForm, description: e.target.value })} placeholder="Details of procedure sessions" className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101 min-h-[60px]" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-955 text-xs rounded">
                {isEditingTreatment ? "Update Treatment" : "Log Treatment"}
              </button>
            </form>

            {/* Create / Edit Product Catalog Form */}
            <form onSubmit={handleProductSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center justify-between font-mono">
                <span>{isEditingProduct ? "Edit Product Master" : "Add Product Master"}</span>
                {isEditingProduct && (
                  <button type="button" onClick={cancelEdits} className="text-[10px] text-rose-455 hover:underline font-bold uppercase">
                    Cancel
                  </button>
                )}
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="block text-[9px] text-slate-400 mb-0.5">Product Name *</label>
                  <input type="text" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-0.5">SKU (Unique) *</label>
                  <input type="text" required value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-0.5">Category *</label>
                  <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101">
                    <option value="MEDICINE">MEDICINE</option>
                    <option value="RETAIL_PRODUCT">RETAIL PRODUCT</option>
                    <option value="CONSUMABLE">CONSUMABLE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-0.5">Packing Unit *</label>
                  <input type="text" required value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} placeholder="Bottle" className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-101" />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-0.5">Purchase Cost *</label>
                  <input type="number" required value={productForm.purchasePrice} onChange={(e) => setProductForm({ ...productForm, purchasePrice: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-0.5">MRP Price *</label>
                  <input type="number" required value={productForm.sellingPrice} onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 mb-0.5">TAX Rate % *</label>
                  <select value={productForm.taxRate} onChange={(e) => setProductForm({ ...productForm, taxRate: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101">
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="13">13%</option>
                    <option value="18">18%</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] text-slate-450 mb-0.5">Supplier Name *</label>
                  <input type="text" required value={productForm.supplier} onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-955 text-xs rounded">
                {isEditingProduct ? "Update Product" : "Log Product SKU"}
              </button>
            </form>
          </div>

          {/* Masters Listing Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-6">
            
            {/* Billing Entities */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-355 border-b border-slate-850 pb-2">Active Billing Entities</h3>
              <div className="divide-y divide-slate-850 max-h-[150px] overflow-y-auto">
                {billingEntities.map((be) => (
                  <div key={be.id} className="py-2 text-[11px] text-slate-300 flex justify-between items-center">
                    <div>
                      <strong>{be.legalName}</strong> (Prefix: {be.invoicePrefix}) <br />
                      <span className="text-[10px] text-slate-500">TAX Reg: {be.gstin} • Bank: {be.bankDetails}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditBilling(be)} className="p-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-emerald-450 border border-slate-755 rounded transition-all cursor-pointer" title="Edit Billing Entity">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteWithPassword("Billing Entity", be.id, `/api/billing-entities?id=${be.id}`)} className="p-1 bg-slate-850 hover:bg-rose-950 text-rose-500 hover:text-rose-450 border border-slate-750 rounded transition-all cursor-pointer" title="Delete Billing Entity">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Treatment Catalog */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-355 border-b border-slate-850 pb-2">Treatment Catalog</h3>
              <div className="divide-y divide-slate-850 max-h-[150px] overflow-y-auto">
                {treatments.map((tr) => (
                  <div key={tr.id} className="py-2.5 text-[11px] text-slate-300 flex justify-between items-center">
                    <span>
                      <strong>{tr.name}</strong> ({tr.category}) - <span className="font-bold text-emerald-450">{globalSettingsForm.currency} {tr.basePrice}</span>
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => startEditTreatment(tr)} className="p-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-emerald-450 border border-slate-755 rounded cursor-pointer" title="Edit Treatment">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleStandardDelete("Treatment Catalog Item", tr.id, `/api/treatments/${tr.id}`)} className="p-1 bg-slate-850 hover:bg-rose-950 text-rose-500 hover:text-rose-450 border border-slate-750 rounded cursor-pointer" title="Delete Treatment">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product SKUs */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-355 border-b border-slate-850 pb-2">Product Master SKUs</h3>
              <div className="divide-y divide-slate-850 max-h-[150px] overflow-y-auto">
                {products.map((pr) => (
                  <div key={pr.id} className="py-2.5 text-[11px] text-slate-300 flex justify-between items-center">
                    <span>
                      <strong>{pr.name}</strong> (SKU: {pr.sku}) - <span className="text-slate-400">MRP: {globalSettingsForm.currency} {pr.sellingPrice}</span>
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => startEditProduct(pr)} className="p-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-emerald-450 border border-slate-755 rounded cursor-pointer" title="Edit Product SKU">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleStandardDelete("Product SKU", pr.id, `/api/products/${pr.id}`)} className="p-1 bg-slate-850 hover:bg-rose-950 text-rose-500 hover:text-rose-450 border border-slate-750 rounded cursor-pointer" title="Delete Product SKU">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. Tab: GLOBAL SETTINGS */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-6 animate-fadeIn">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-455" /> Global EMR settings Console
            </h2>
            <p className="text-xs text-slate-450 mt-1">Configure Nepal VAT/GST tax frameworks, Sparrow SMS endpoints, app branding, and national ID requirements.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4 bg-slate-950/20 border border-slate-850 p-5 rounded-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">1. App Branding & Local Currency</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-1">Business Clinic name *</label>
                  <input type="text" required value={globalSettingsForm.businessName} onChange={(e) => setGlobalSettingsForm({ ...globalSettingsForm, businessName: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 font-bold text-white" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Currency Code (NPR/INR) *</label>
                  <input type="text" required value={globalSettingsForm.currency} onChange={(e) => setGlobalSettingsForm({ ...globalSettingsForm, currency: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Tax Framework *</label>
                  <select value={globalSettingsForm.taxType} onChange={(e) => setGlobalSettingsForm({ ...globalSettingsForm, taxType: e.target.value as any, taxRate: e.target.value === "VAT" ? 13 : 18 })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5">
                    <option value="VAT">Nepal VAT (13%)</option>
                    <option value="GST">India GST (18%)</option>
                    <option value="NONE">Tax Exempted (0%)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-slate-950/20 border border-slate-850 p-5 rounded-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">2. Compliance & National Registries</h4>
              
              <div className="space-y-3">
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer py-1 border-b border-slate-850/40">
                  <input type="checkbox" checked={globalSettingsForm.citizenshipIdRequired} onChange={(e) => setGlobalSettingsForm({ ...globalSettingsForm, citizenshipIdRequired: e.target.checked })} className="rounded text-emerald-500 bg-slate-955 border-slate-800" />
                  <span>Collect Citizenship/National ID on Registration</span>
                </label>
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer py-1 border-b border-slate-850/40">
                  <input type="checkbox" checked={globalSettingsForm.irdApprovedBilling} onChange={(e) => setGlobalSettingsForm({ ...globalSettingsForm, irdApprovedBilling: e.target.checked })} className="rounded text-emerald-500 bg-slate-955 border-slate-800" />
                  <span>Enforce IRD Nepal approved sequential bill print lock (VAT)</span>
                </label>
                <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer py-1">
                  <input type="checkbox" checked={globalSettingsForm.abhaEnabled} onChange={(e) => setGlobalSettingsForm({ ...globalSettingsForm, abhaEnabled: e.target.checked })} className="rounded text-emerald-500 bg-slate-955 border-slate-800" />
                  <span>Enable Ayushman Bharat (ABHA/ABDM) sync frameworks (India)</span>
                </label>
              </div>
            </div>

            <div className="space-y-4 bg-slate-950/20 border border-slate-850 p-5 rounded-lg md:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">3. WhatsApp Business API & Sparrow SMS Integration</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Gateway Selector</label>
                  <input type="text" value={globalSettingsForm.smsGateway} onChange={(e) => setGlobalSettingsForm({ ...globalSettingsForm, smsGateway: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">API Key / Token</label>
                  <input type="password" value={globalSettingsForm.smsApiKey} onChange={(e) => setGlobalSettingsForm({ ...globalSettingsForm, smsApiKey: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Sender ID (Approved mask)</label>
                  <input type="text" value={globalSettingsForm.smsSenderId} onChange={(e) => setGlobalSettingsForm({ ...globalSettingsForm, smsSenderId: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5" />
                </div>
                <div className="md:col-span-3 flex gap-6 pt-2">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={globalSettingsForm.whatsappEnabled} onChange={(e) => setGlobalSettingsForm({ ...globalSettingsForm, whatsappEnabled: e.target.checked })} className="rounded text-emerald-500 bg-slate-955 border-slate-800" />
                    <span>WhatsApp-First confirmations (confirmations, PDF transcripts, follow-ups)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="py-3 px-6 bg-emerald-600 hover:bg-emerald-505 font-bold text-slate-955 text-xs rounded shadow-lg transition-all">
            Save EMR Configurations
          </button>
        </form>
      )}

      {/* 7. Tab: SECURITY SETTINGS */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            {/* Global Deletion Password Override */}
            <form onSubmit={handleSaveDeletionPassword} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-850 pb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-450" /> Deletion Profile Password Settings
              </h3>
              <p className="text-xs text-slate-455 leading-relaxed">
                Configure the master verification password required to delete active clinics, doctors, staff profiles, or billing entities from the database. Default: <code className="text-white font-mono bg-slate-955 px-1 py-0.5 rounded">admin123</code>.
              </p>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">New Deletion Password *</label>
                <input
                  type="password"
                  required
                  value={securityForm.deletionPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, deletionPassword: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Confirm Deletion Password *</label>
                <input
                  type="password"
                  required
                  value={securityForm.confirmDeletionPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirmDeletionPassword: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                />
              </div>

              <button type="submit" disabled={loading} className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-955 rounded transition-all">
                Save Deletion Password
              </button>
            </form>

            {/* Overrides User Login Password */}
            <form onSubmit={handleResetUserPassword} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-850 pb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-400" /> Administrative Password Reset Console
              </h3>
              <p className="text-xs text-slate-450">
                Change or reset the login password of any doctor, front-desk staff member, patient record, or administrator profile.
              </p>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Target Account Role *</label>
                <select
                  value={passwordResetForm.userType}
                  onChange={(e) => {
                    setPasswordResetForm({ ...passwordResetForm, userType: e.target.value, selectedUserId: "" });
                    setPatientSearchQuery("");
                    setPatientSearchResults([]);
                  }}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-slate-101"
                >
                  <option value="DOCTOR">Doctor / Specialist</option>
                  <option value="STAFF">Clinic Front-Desk Staff</option>
                  <option value="PATIENT">Patient Portal Account</option>
                </select>
              </div>

              {/* Conditional selectors depending on userType */}
              {passwordResetForm.userType === "DOCTOR" && (
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Select Doctor *</label>
                  <select
                    required
                    value={passwordResetForm.selectedUserId}
                    onChange={(e) => setPasswordResetForm({ ...passwordResetForm, selectedUserId: e.target.value })}
                    className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-slate-101"
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.userId}>{d.name} ({d.user?.email})</option>
                    ))}
                  </select>
                </div>
              )}

              {passwordResetForm.userType === "STAFF" && (
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Select Staff Member *</label>
                  <select
                    required
                    value={passwordResetForm.selectedUserId}
                    onChange={(e) => setPasswordResetForm({ ...passwordResetForm, selectedUserId: e.target.value })}
                    className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-slate-101"
                  >
                    <option value="">-- Select Staff --</option>
                    {staffs.map((s) => (
                      <option key={s.id} value={s.userId}>{s.name} ({s.user?.email})</option>
                    ))}
                  </select>
                </div>
              )}

              {passwordResetForm.userType === "PATIENT" && (
                <div className="space-y-2">
                  <label className="block text-[10px] text-slate-400 mb-0.5">Search Patient ID/MRN *</label>
                  <input
                    type="text"
                    value={patientSearchQuery}
                    onChange={(e) => handlePatientSearch(e.target.value)}
                    placeholder="Type patient name, MRN, mobile..."
                    className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-slate-100"
                  />
                  {patientSearchResults.length > 0 && (
                    <select
                      required
                      value={passwordResetForm.selectedUserId}
                      onChange={(e) => setPasswordResetForm({ ...passwordResetForm, selectedUserId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-emerald-450"
                    >
                      <option value="">-- Click to Select Patient --</option>
                      {patientSearchResults.map((p) => (
                        <option key={p.id} value={p.userId}>{p.name} ({p.mrn} • {p.email})</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">New Login Password *</label>
                <input
                  type="password"
                  required
                  value={passwordResetForm.newPassword}
                  onChange={(e) => setPasswordResetForm({ ...passwordResetForm, newPassword: e.target.value })}
                  placeholder="At least 5 characters"
                  className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                />
              </div>

              <button type="submit" disabled={loading} className="py-2.5 px-5 bg-sky-600 hover:bg-sky-505 font-bold text-white rounded transition-all">
                Reset Login Password
              </button>
            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Admin Dashboard Suite...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
