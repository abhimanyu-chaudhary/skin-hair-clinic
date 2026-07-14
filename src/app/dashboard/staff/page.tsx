"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  UserPlus,
  Calendar,
  Receipt,
  Package,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Printer,
  Users,
  ClipboardList,
  Edit3,
  Lock,
} from "lucide-react";

function StaffDashboardContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("checkin");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Edit Patient state
  const [isEditingPatient, setIsEditingPatient] = useState(false);

  // Global settings & User permissions loaded on mount
  const [globalSettings, setGlobalSettings] = useState<any>({
    businessName: "Nepal Skin & Hair Clinic",
    taxType: "VAT",
    taxRate: 13,
    currency: "NPR",
    citizenshipIdRequired: true,
  });
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userId, setUserId] = useState("");

  // Common stats state
  const [stats, setStats] = useState({
    totalCollectedToday: 0,
    totalOutstanding: 0,
    lowStockCount: 0,
    checkInQueueLength: 0,
  });

  // Today's appointments state
  const [appointments, setAppointments] = useState<any[]>([]);

  // Masters
  const [clinics, setClinics] = useState<any[]>([]);
  const [billingEntities, setBillingEntities] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Patient Form state (shared between new registration and edits)
  const [patientForm, setPatientForm] = useState({
    name: "",
    dob: "",
    gender: "MALE",
    mobile: "",
    altMobile: "",
    email: "",
    address: "",
    emergencyName: "",
    emergencyMobile: "",
    bloodGroup: "O+",
    allergies: "",
    chronicConditions: "",
    currentMedications: "",
    pastTreatments: "",
    referralSource: "Walk-in",
    govtIdType: "Citizenship ID",
    govtIdNumber: "",
    consentRecorded: true,
  });

  // Generated Credentials Modal state
  const [generatedCredentials, setGeneratedCredentials] = useState<any>(null);

  // New Appointment Form state
  const [appForm, setAppForm] = useState({
    doctorId: "",
    clinicId: "",
    appointmentDate: "",
    type: "CONSULTATION",
    notes: "",
  });

  // Invoice creation state
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [invoiceClinicId, setInvoiceClinicId] = useState("");
  const [invoiceBillingEntityId, setInvoiceBillingEntityId] = useState("");
  const [invoiceBillDiscount, setInvoiceBillDiscount] = useState("0");
  const [invoiceDiscountReason, setInvoiceDiscountReason] = useState("");
  const [invoicePayments, setInvoicePayments] = useState<any[]>([
    { amount: "0", paymentMode: "CASH", paymentType: "FULL", transactionId: "" },
  ]);
  const [printedInvoice, setPrintedInvoice] = useState<any>(null);

  // Inventory Purchase Form state
  const [purchaseForm, setPurchaseForm] = useState({
    productId: "",
    supplier: "",
    invoiceNumber: "",
    batchNumber: "",
    expiryDate: "",
    quantity: "10",
    cost: "1000",
  });
  const [inventoryAlerts, setInventoryAlerts] = useState<any>({ nearExpiry: [], lowStock: [] });

  // Sync activeTab with URL params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
      setErrorMsg("");
      setSuccessMsg("");
      setIsEditingPatient(false);
      setGeneratedCredentials(null);
    }
  }, [searchParams]);

  // Load basic configurations, user profile and settings
  useEffect(() => {
    fetchStats();
    fetchAppointments();
    loadMasters();
    fetchSettingsAndUser();
  }, [activeTab]);

  const fetchSettingsAndUser = async () => {
    try {
      const [resSet, resMe] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/auth/me"),
      ]);

      if (resSet.ok) {
        const setData = await resSet.json();
        setGlobalSettings(setData);
      }

      if (resMe.ok) {
        const meData = await resMe.json();
        setUserId(meData.user.id);
        if (meData.user.role === "SUPER_ADMIN") {
          // Super admin bypasses all locks
          setUserPermissions([
            "register_patient",
            "book_appointment",
            "generate_invoice",
            "manage_inventory",
            "add_treatment_catalog",
            "add_product_master",
          ]);
        } else {
          setUserPermissions(meData.user.permissions || []);
        }
      }
    } catch (err) {
      console.error("Failed to load settings or user permissions context:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalCollectedToday: data.totalCollectedToday || 0,
          totalOutstanding: data.totalOutstanding || 0,
          lowStockCount: data.lowStockCount || 0,
          checkInQueueLength: data.checkInQueueLength || 0,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/appointments?date=${todayStr}`);
      if (res.ok) {
        setAppointments(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMasters = async () => {
    try {
      const [resC, resB, resD, resP, resT, resA] = await Promise.all([
        fetch("/api/clinics"),
        fetch("/api/billing-entities"),
        fetch("/api/doctors"),
        fetch("/api/products"),
        fetch("/api/treatments"),
        fetch("/api/inventory/alerts"),
      ]);

      if (resC.ok) setClinics(await resC.json());
      if (resB.ok) setBillingEntities(await resB.json());
      if (resD.ok) setDoctors(await resD.json());
      if (resP.ok) setProducts(await resP.json());
      if (resT.ok) setTreatments(await resT.json());
      if (resA.ok) setInventoryAlerts(await resA.json());
    } catch (err) {
      console.error("Failed to load masters", err);
    }
  };

  // Check custom staff permissions
  const hasAccess = (permissionKey: string) => {
    return userPermissions.includes(permissionKey);
  };

  // Helper to wrap panels with custom lock banners
  const renderRestrictedLock = (permissionLabel: string) => {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center shadow-lg relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] animate-fadeIn">
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] z-0" />
        <div className="relative z-10 space-y-4">
          <div className="mx-auto w-12 h-12 bg-rose-955 border border-rose-900 text-rose-500 rounded-full flex items-center justify-center">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Access Restricted</h3>
          <p className="text-xs text-slate-450 max-w-md mx-auto leading-relaxed">
            Your staff account does not have permission to execute <strong>{permissionLabel}</strong>. Please request permission allocation from your system administrator in the Settings panel.
          </p>
        </div>
      </div>
    );
  };

  // Handle Arrive check-in
  const handleCheckIn = async (appointmentId: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARRIVED" }),
      });
      if (res.ok) {
        setSuccessMsg("Patient checked in and token generated successfully!");
        fetchAppointments();
        fetchStats();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Check-in failed");
      }
    } catch (err) {
      setErrorMsg("Failed to check-in patient");
    }
  };

  // Handle Patient search
  const handlePatientSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/patients?search=${val}`);
      if (res.ok) {
        setSearchResults(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Patient Registration
  const handleRegisterPatient = async (e: React.FormEvent, force = false) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patientForm, force }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          if (confirm(`Warning: Mobile already exists. Active patient: ${data.patient.name} (${data.patient.mrn}). Do you want to force register?`)) {
            handleRegisterPatient(e, true);
            return;
          }
        }
        throw new Error(data.error || "Registration failed");
      }

      setSuccessMsg(`Patient registered successfully! MRN generated: ${data.mrn}`);
      setSelectedPatient(data.patient);
      setGeneratedCredentials({
        email: data.loginEmail,
        password: data.loginPassword,
      });

      setPatientForm({
        name: "",
        dob: "",
        gender: "MALE",
        mobile: "",
        altMobile: "",
        email: "",
        address: "",
        emergencyName: "",
        emergencyMobile: "",
        bloodGroup: "O+",
        allergies: "",
        chronicConditions: "",
        currentMedications: "",
        pastTreatments: "",
        referralSource: "Walk-in",
        govtIdType: globalSettings.citizenshipIdRequired ? "Citizenship ID" : "Aadhaar",
        govtIdNumber: "",
        consentRecorded: true,
      });
      loadMasters();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register patient");
    } finally {
      setLoading(false);
    }
  };

  // Handle Editing Demographics
  const handleEditPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!selectedPatient) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Demographics update failed");

      setSuccessMsg("Patient demographics updated successfully!");
      setSelectedPatient(data.patient);
      setIsEditingPatient(false);
      if (searchQuery) handlePatientSearch(searchQuery);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditPatient = () => {
    if (!selectedPatient) return;
    setPatientForm({
      name: selectedPatient.name,
      dob: selectedPatient.dob ? selectedPatient.dob.split("T")[0] : "",
      gender: selectedPatient.gender,
      mobile: selectedPatient.mobile,
      altMobile: selectedPatient.altMobile || "",
      email: selectedPatient.email || "",
      address: selectedPatient.address,
      emergencyName: selectedPatient.emergencyName,
      emergencyMobile: selectedPatient.emergencyMobile,
      bloodGroup: selectedPatient.bloodGroup || "O+",
      allergies: selectedPatient.allergies || "",
      chronicConditions: selectedPatient.chronicConditions || "",
      currentMedications: selectedPatient.currentMedications || "",
      pastTreatments: selectedPatient.pastTreatments || "",
      referralSource: selectedPatient.referralSource,
      govtIdType: selectedPatient.govtIdType || (globalSettings.citizenshipIdRequired ? "Citizenship ID" : "Aadhaar"),
      govtIdNumber: selectedPatient.govtIdNumber || "",
      consentRecorded: selectedPatient.consentRecorded,
    });
    setIsEditingPatient(true);
  };

  // Handle Appointment Booking
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!selectedPatient) {
      setErrorMsg("Please select or search a patient first.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          doctorId: appForm.doctorId,
          clinicId: appForm.clinicId,
          appointmentDate: appForm.appointmentDate,
          type: appForm.type,
          notes: appForm.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      setSuccessMsg("Appointment booked successfully!");
      setAppForm({ doctorId: "", clinicId: "", appointmentDate: "", type: "CONSULTATION", notes: "" });
      fetchAppointments();
      fetchStats();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  // Invoice configuration helpers
  const addInvoiceProductLine = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const stock = prod.batches.reduce((sum: number, b: any) => sum + b.quantity, 0);
    if (stock <= 0) {
      alert(`Warning: '${prod.name}' is out of stock!`);
      return;
    }

    setInvoiceItems([
      ...invoiceItems,
      {
        itemType: "PRODUCT",
        description: prod.name,
        quantity: "1",
        unitPrice: prod.sellingPrice.toString(),
        taxRate: globalSettings.taxRate.toString(), // Default from settings
        discountAmount: "0",
        productId: prod.id,
      },
    ]);
  };

  const addInvoiceConsultationLine = () => {
    setInvoiceItems([
      ...invoiceItems,
      {
        itemType: "CONSULTATION",
        description: "Doctor Consultation Fee",
        quantity: "1",
        unitPrice: "800",
        taxRate: globalSettings.taxRate.toString(),
        discountAmount: "0",
      },
    ]);
  };

  const addInvoiceTreatmentLine = (tId: string) => {
    const tr = treatments.find((t) => t.id === tId);
    if (!tr) return;

    setInvoiceItems([
      ...invoiceItems,
      {
        itemType: "TREATMENT",
        description: tr.name,
        quantity: "1",
        unitPrice: tr.basePrice.toString(),
        taxRate: globalSettings.taxRate.toString(),
        discountAmount: "0",
      },
    ]);
  };

  const calculateInvoiceTotals = () => {
    let subTotal = 0;
    let totalTax = 0;
    const billDiscount = parseFloat(invoiceBillDiscount || "0");

    invoiceItems.forEach((item) => {
      const qty = parseInt(item.quantity, 10) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const discount = parseFloat(item.discountAmount) || 0;
      const taxRate = parseFloat(item.taxRate) || 0;

      const lineTotal = qty * price - discount;
      const lineTax = lineTotal * (taxRate / 100);

      subTotal += lineTotal;
      totalTax += lineTax;
    });

    const totalAmount = Math.max(0, subTotal + totalTax - billDiscount);

    return { subTotal, totalTax, totalAmount };
  };

  // Handle split payment adjustments
  const updateSplitPayment = (index: number, field: string, val: string) => {
    const updated = [...invoicePayments];
    updated[index][field] = val;
    setInvoicePayments(updated);
  };

  const addPaymentSplit = () => {
    setInvoicePayments([
      ...invoicePayments,
      { amount: "0", paymentMode: "UPI", paymentType: "INSTALLMENT", transactionId: "" },
    ]);
  };

  const removePaymentSplit = (index: number) => {
    const updated = [...invoicePayments];
    updated.splice(index, 1);
    setInvoicePayments(updated);
  };

  // Submit Invoice billing
  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setPrintedInvoice(null);

    if (!selectedPatient) {
      setErrorMsg("Select a patient to issue an invoice.");
      return;
    }
    if (invoiceItems.length === 0) {
      setErrorMsg("Add at least one line item to build the invoice.");
      return;
    }
    if (!invoiceClinicId || !invoiceBillingEntityId) {
      setErrorMsg("Select both the Branch Clinic and the Legal Billing Entity.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: invoiceClinicId,
          billingEntityId: invoiceBillingEntityId,
          patientId: selectedPatient.id,
          items: invoiceItems,
          discountAmount: invoiceBillDiscount,
          discountReason: invoiceDiscountReason,
          payments: invoicePayments,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate invoice");

      setSuccessMsg(`Invoice generated successfully! Inv Number: ${data.invoice.invoiceNumber}`);
      
      const detailRes = await fetch(`/api/billing/invoices/${data.invoiceId}`);
      if (detailRes.ok) {
        setPrintedInvoice(await detailRes.json());
      }

      setInvoiceItems([]);
      setInvoiceBillDiscount("0");
      setInvoiceDiscountReason("");
      setInvoicePayments([{ amount: "0", paymentMode: "CASH", paymentType: "FULL", transactionId: "" }]);
      loadMasters();
      fetchStats();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate invoice");
    } finally {
      setLoading(false);
    }
  };

  // Handle Log Purchase Entry
  const handlePurchaseEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/inventory/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purchaseForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purchase log failed");

      setSuccessMsg("Purchase logged and product inventory batch updated successfully!");
      setPurchaseForm({
        productId: "",
        supplier: "",
        invoiceNumber: "",
        batchNumber: "",
        expiryDate: "",
        quantity: "10",
        cost: "1000",
      });
      loadMasters();
      fetchStats();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log purchase delivery");
    } finally {
      setLoading(false);
    }
  };

  const { subTotal, totalTax, totalAmount } = calculateInvoiceTotals();

  return (
    <div className="space-y-6">
      {/* 1. High level statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Today's Revenue</span>
            <h4 className="text-xl font-bold text-emerald-400 mt-1">{globalSettings.currency} {stats.totalCollectedToday.toLocaleString()}</h4>
          </div>
          <div className="p-3 bg-emerald-955/40 border border-emerald-800/35 text-emerald-400 rounded-lg">
            <Receipt className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Pending Dues</span>
            <h4 className="text-xl font-bold text-amber-500 mt-1">{globalSettings.currency} {stats.totalOutstanding.toLocaleString()}</h4>
          </div>
          <div className="p-3 bg-amber-955/40 border border-amber-900/35 text-amber-550 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Arrived Queue</span>
            <h4 className="text-xl font-bold text-sky-400 mt-1">{stats.checkInQueueLength} Patients</h4>
          </div>
          <div className="p-3 bg-sky-955/40 border border-sky-800/35 text-sky-400 rounded-lg">
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Low Stock Products</span>
            <h4 className="text-xl font-bold text-rose-500 mt-1">{stats.lowStockCount} Items</h4>
          </div>
          <div className="p-3 bg-rose-955/40 border border-rose-800/35 text-rose-550 rounded-lg">
            <Package className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Message alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-955/30 border border-emerald-800/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-955/20 border border-rose-900/35 text-rose-350 rounded-xl text-xs flex items-center gap-2.5 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-rose-455 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Generated Credentials Popup display for staff */}
      {generatedCredentials && (
        <div className="p-5 bg-indigo-950/40 border-2 border-indigo-850 text-slate-200 rounded-xl text-xs space-y-2.5 shadow-lg relative animate-pulse">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Generated Patient Portal Login Credentials</h4>
          <p>Please note down these credentials to give to the patient:</p>
          <div className="grid grid-cols-2 gap-4 bg-slate-955 p-3 rounded border border-indigo-900/30 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5 font-sans">Login ID</span>
              <strong className="text-white">{generatedCredentials.email}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5 font-sans">Default Password</span>
              <strong className="text-white">{generatedCredentials.password}</strong>
            </div>
          </div>
          <button onClick={() => setGeneratedCredentials(null)} className="text-[10px] underline font-bold uppercase text-slate-400 hover:text-white cursor-pointer">
            Dismiss Credentials Box
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-1">
        {[
          { id: "checkin", label: "Check-in Queue", icon: ClipboardList, perm: "book_appointment" },
          { id: "register", label: "Patient Registration", icon: UserPlus, perm: "register_patient" },
          { id: "search", label: "Patient Directory", icon: Search, perm: "register_patient" },
          { id: "billing", label: "Billing Ledger", icon: Receipt, perm: "generate_invoice" },
          { id: "inventory", label: "Inventory Stock", icon: Package, perm: "manage_inventory" },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setErrorMsg("");
                setSuccessMsg("");
                setIsEditingPatient(false);
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

      {/* 3.1 Tab: CHECK IN QUEUE */}
      {activeTab === "checkin" && (
        !hasAccess("book_appointment") ? renderRestrictedLock("Schedule Bookings & Queue Management") : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Today's Appointment Schedule</h2>
                <p className="text-xs text-slate-455 mt-1">Check-in patients to push them into live doctor consult queue.</p>
              </div>
              <button onClick={fetchAppointments} className="py-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 border border-slate-755 rounded-lg cursor-pointer">
                Refresh
              </button>
            </div>

            {appointments.length === 0 ? (
              <p className="text-slate-500 text-xs py-8 text-center bg-slate-955/20 border border-dashed border-slate-800 rounded-lg">
                No appointments scheduled for today.
              </p>
            ) : (
              <div className="overflow-x-auto animate-fadeIn">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase bg-slate-900/40">
                      <th className="py-3.5 px-4">Patient (MRN)</th>
                      <th className="py-3.5 px-4">Doctor</th>
                      <th className="py-3.5 px-4">Time Slot</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Daily Token</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {appointments.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-855/30 transition-all">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{app.patient.name}</div>
                          <div className="text-[10px] text-emerald-455 mt-0.5">{app.patient.mrn}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">{app.doctor.name}</td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(app.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                            {app.type.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            app.status === "COMPLETED" ? "bg-emerald-950/40 border border-emerald-900/30 text-emerald-450" :
                            app.status === "ARRIVED" ? "bg-sky-955/35 border border-sky-900/35 text-sky-400" :
                            app.status === "IN_CONSULTATION" ? "bg-purple-955/35 border border-purple-900/35 text-purple-400" :
                            "bg-slate-800 text-slate-400"
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400">
                          {app.queueNumber ? `#${app.queueNumber}` : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {app.status === "BOOKED" && (
                            <button onClick={() => handleCheckIn(app.id)} className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg cursor-pointer transition-all">
                              Mark Arrived
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      )}

      {/* 3.2 Tab: PATIENT REGISTRATION */}
      {activeTab === "register" && (
        !hasAccess("register_patient") ? renderRestrictedLock("Register Patients & Edit Demographics") : (
          <form onSubmit={handleRegisterPatient} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-6 animate-fadeIn">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-450" /> Patient Registration Demographics
              </h2>
              <p className="text-xs text-slate-455 mt-1">Register walk-in or telephone patients. Auto-configures portal credentials.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={patientForm.name}
                  onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-4 py-2.5 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={patientForm.dob}
                  onChange={(e) => setPatientForm({ ...patientForm, dob: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-4 py-2.5 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Gender *</label>
                <select
                  value={patientForm.gender}
                  onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-4 py-2.5 text-xs text-slate-101"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Primary Mobile *</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  value={patientForm.mobile}
                  onChange={(e) => setPatientForm({ ...patientForm, mobile: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-4 py-2.5 text-xs text-slate-101"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Emergency Contact Person *</label>
                <input
                  type="text"
                  required
                  value={patientForm.emergencyName}
                  onChange={(e) => setPatientForm({ ...patientForm, emergencyName: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-4 py-2.5 text-xs text-slate-101"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Emergency Mobile *</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  value={patientForm.emergencyMobile}
                  onChange={(e) => setPatientForm({ ...patientForm, emergencyMobile: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-4 py-2.5 text-xs text-slate-101"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Residential Address *</label>
                <input
                  type="text"
                  required
                  value={patientForm.address}
                  onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-4 py-2.5 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={patientForm.email}
                  onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-4 py-2.5 text-xs text-slate-101"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Referral Source *</label>
                <select
                  value={patientForm.referralSource}
                  onChange={(e) => setPatientForm({ ...patientForm, referralSource: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-4 py-2.5 text-xs text-slate-101"
                >
                  <option value="Walk-in">Walk-in</option>
                  <option value="Google">Google Search</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Referral Doctor">Referral Doctor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Known Allergies</label>
                <input
                  type="text"
                  value={patientForm.allergies}
                  onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-4 py-2.5 text-xs text-slate-101"
                />
              </div>

              {globalSettings.citizenshipIdRequired && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Citizenship/National ID Number *</label>
                  <input
                    type="text"
                    required
                    value={patientForm.govtIdNumber}
                    onChange={(e) => setPatientForm({ ...patientForm, govtIdNumber: e.target.value })}
                    placeholder="Nepal Citizenship Card No"
                    className="w-full bg-slate-955 border border-slate-800 rounded px-4 py-2.5 text-xs text-slate-101"
                  />
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-955 rounded-lg text-xs cursor-pointer transition-all">
              {loading ? "Registering..." : "Submit Registration & Enable Login"}
            </button>
          </form>
        )
      )}

      {/* 3.3 Tab: PATIENT DIRECTORY & EDITING */}
      {activeTab === "search" && (
        !hasAccess("register_patient") ? renderRestrictedLock("Register Patients & Edit Demographics") : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4 md:col-span-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Search Patient Registry</h3>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handlePatientSearch(e.target.value)}
                  placeholder="Search by name, MRN, mobile..."
                  className="w-full bg-slate-955 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-550" />
              </div>

              <div className="divide-y divide-slate-850 max-h-[350px] overflow-y-auto">
                {searchResults.map((pat) => (
                  <button
                    key={pat.id}
                    onClick={() => {
                      setSelectedPatient(pat);
                      setIsEditingPatient(false);
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className={`w-full text-left py-3 px-2 rounded-lg transition-all text-xs block ${
                      selectedPatient?.id === pat.id
                        ? "bg-slate-850 text-white font-medium"
                        : "hover:bg-slate-855 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="font-bold text-slate-100">{pat.name}</div>
                    <div className="text-[10px] text-emerald-455 mt-0.5">{pat.mrn} • {pat.mobile}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md md:col-span-2 space-y-6">
              {!selectedPatient ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-slate-500">
                  <Users className="h-10 w-10 text-slate-700 mb-3" />
                  <p className="text-xs text-center max-w-sm">Search and select a patient in the left directory to log consults, issue invoices, or edit details.</p>
                </div>
              ) : isEditingPatient ? (
                <form onSubmit={handleEditPatientSubmit} className="space-y-4">
                  <div className="border-b border-slate-850 pb-3 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Edit Demographics: {selectedPatient.name}</h3>
                    <button type="button" onClick={() => setIsEditingPatient(false)} className="text-xs text-rose-455 hover:underline font-bold uppercase">
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Name *</label>
                      <input type="text" required value={patientForm.name} onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-100" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">DOB *</label>
                      <input type="date" required value={patientForm.dob} onChange={(e) => setPatientForm({ ...patientForm, dob: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-100" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Gender</label>
                      <select value={patientForm.gender} onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-101">
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Mobile *</label>
                      <input type="tel" required value={patientForm.mobile} onChange={(e) => setPatientForm({ ...patientForm, mobile: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-101" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Emergency Person *</label>
                      <input type="text" required value={patientForm.emergencyName} onChange={(e) => setPatientForm({ ...patientForm, emergencyName: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-101" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Emergency Phone *</label>
                      <input type="tel" required value={patientForm.emergencyMobile} onChange={(e) => setPatientForm({ ...patientForm, emergencyMobile: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-101" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-400 mb-0.5">Address *</label>
                      <input type="text" required value={patientForm.address} onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-100" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Allergies</label>
                      <input type="text" value={patientForm.allergies} onChange={(e) => setPatientForm({ ...patientForm, allergies: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-101" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Chronic Conditions</label>
                      <input type="text" value={patientForm.chronicConditions} onChange={(e) => setPatientForm({ ...patientForm, chronicConditions: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-101" />
                    </div>
                    {globalSettings.citizenshipIdRequired && (
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Citizenship/National ID</label>
                        <input type="text" value={patientForm.govtIdNumber} onChange={(e) => setPatientForm({ ...patientForm, govtIdNumber: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-101" />
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={loading} className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-950 rounded cursor-pointer mt-3">
                    {loading ? "Updating..." : "Save Demographics Profile"}
                  </button>
                </form>
              ) : (
                <>
                  <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        {selectedPatient.name}
                        <button onClick={startEditPatient} className="text-slate-500 hover:text-emerald-455 cursor-pointer" title="Edit Patient Info">
                          <Edit3 className="h-4.5 w-4.5" />
                        </button>
                      </h2>
                      <p className="text-xs text-slate-455 mt-1">
                        MRN: <strong className="text-emerald-455">{selectedPatient.mrn}</strong> • Phone: {selectedPatient.mobile} • Age: {new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()} yrs
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setActiveTab("billing");
                          setInvoiceItems([]);
                          setInvoiceClinicId(selectedPatient.clinicId || clinics[0]?.id || "");
                          setInvoiceBillingEntityId(clinics[0]?.billingEntityId || billingEntities[0]?.id || "");
                        }}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-955 text-xs font-bold rounded transition-all flex items-center gap-1"
                      >
                        <Receipt className="h-3.5 w-3.5" /> Invoice Bill
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-850 space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Patient Portal Login Access Info</h4>
                    <div className="text-xs text-slate-400 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Login ID</span>
                        <strong className="text-white font-mono">{selectedPatient.email || `${selectedPatient.mrn.toLowerCase()}@clinic.com`}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Default Password</span>
                        <strong className="text-white font-mono">{selectedPatient.mobile}</strong>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleBookAppointment} className="space-y-4 bg-slate-950/20 border border-slate-800 p-5 rounded-lg">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-455" /> Book Roster Slot
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Clinic Branch *</label>
                        <select required value={appForm.clinicId} onChange={(e) => setAppForm({ ...appForm, clinicId: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-slate-101">
                          <option value="">-- Choose Branch --</option>
                          {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Consulting Doctor *</label>
                        <select required value={appForm.doctorId} onChange={(e) => setAppForm({ ...appForm, doctorId: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-slate-101">
                          <option value="">-- Choose Specialist --</option>
                          {doctors.filter(d => d.status === "ACTIVE").map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Appointment Slot *</label>
                        <input type="datetime-local" required value={appForm.appointmentDate} onChange={(e) => setAppForm({ ...appForm, appointmentDate: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-slate-101" />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Visit Nature *</label>
                        <select value={appForm.type} onChange={(e) => setAppForm({ ...appForm, type: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-slate-101">
                          <option value="CONSULTATION">New Consultation</option>
                          <option value="FOLLOW_UP">Follow-Up Checkup</option>
                          <option value="TREATMENT">Treatment Session</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" disabled={loading} className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-955 text-xs rounded transition-all">
                      Schedule Booking
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )
      )}

      {/* 3.4 Tab: BILLING & INVOICING */}
      {activeTab === "billing" && (
        !hasAccess("generate_invoice") ? renderRestrictedLock("Generate Invoices & Process Billings") : (
          <div className="space-y-6">
            <form onSubmit={handleGenerateInvoice} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-6 animate-fadeIn">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-emerald-455" /> Patient Invoicing Ledger
                </h2>
              </div>

              {!selectedPatient ? (
                <div className="p-4 bg-slate-950 border border-slate-800 text-slate-455 text-xs rounded-lg text-center">
                  Please search/select a patient in the **Patient Directory** tab first to enable billing.
                </div>
              ) : (
                <div className="p-3 bg-slate-955 border border-slate-800 rounded text-xs flex justify-between items-center">
                  <div>Active Billing: <strong className="text-white">{selectedPatient.name}</strong> • MRN: <strong className="text-emerald-455">{selectedPatient.mrn}</strong></div>
                  <button type="button" onClick={() => setSelectedPatient(null)} className="text-rose-455 font-bold hover:underline">Clear</button>
                </div>
              )}

              {selectedPatient && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Clinic Branch *</label>
                      <select required value={invoiceClinicId} onChange={(e) => setInvoiceClinicId(e.target.value)} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-slate-101">
                        <option value="">-- Choose Branch --</option>
                        {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Legal Biller Entity *</label>
                      <select required value={invoiceBillingEntityId} onChange={(e) => setInvoiceBillingEntityId(e.target.value)} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-slate-101">
                        <option value="">-- Choose Entity --</option>
                        {billingEntities.map(e => <option key={e.id} value={e.id}>{e.legalName}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/20 border border-slate-800 rounded-lg space-y-2">
                    <h4 className="font-bold text-slate-350">Quick Add Billing Lines</h4>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={addInvoiceConsultationLine} className="py-1.5 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-[10px] font-bold rounded">
                        + Consultation Fee (₹800)
                      </button>
                      {products.map(p => (
                        <button key={p.id} type="button" onClick={() => addInvoiceProductLine(p.id)} className="py-1.5 px-3 bg-slate-800 hover:bg-slate-755 border border-slate-700 text-[10px] font-bold rounded">
                          + {p.name} (MRP: {p.sellingPrice})
                        </button>
                      ))}
                      {treatments.map(t => (
                        <button key={t.id} type="button" onClick={() => addInvoiceTreatmentLine(t.id)} className="py-1.5 px-3 bg-slate-800 hover:bg-slate-755 border border-slate-700 text-[10px] font-bold rounded">
                          + Package: {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-300">Invoice Items</h4>
                    {invoiceItems.length === 0 ? (
                      <p className="text-slate-500 text-center py-4 border border-slate-850 rounded">Click shortcuts above to add items.</p>
                    ) : (
                      <div className="space-y-2">
                        {invoiceItems.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-955 p-3 rounded border border-slate-850 items-center">
                            <div className="col-span-4">
                              <span className="text-[9px] text-slate-500 uppercase font-bold block">{item.itemType}</span>
                              <span className="font-medium text-white">{item.description}</span>
                            </div>
                            <div className="col-span-2">
                              <input type="number" min="1" value={item.quantity} onChange={(e) => {
                                const copy = [...invoiceItems];
                                copy[idx].quantity = e.target.value;
                                setInvoiceItems(copy);
                              }} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-101" />
                            </div>
                            <div className="col-span-2">
                              <input type="number" value={item.unitPrice} onChange={(e) => {
                                const copy = [...invoiceItems];
                                copy[idx].unitPrice = e.target.value;
                                setInvoiceItems(copy);
                              }} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-101" />
                            </div>
                            <div className="col-span-2">
                              <select value={item.taxRate} onChange={(e) => {
                                const copy = [...invoiceItems];
                                copy[idx].taxRate = e.target.value;
                                setInvoiceItems(copy);
                              }} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-101">
                                <option value="0">0% Excluded</option>
                                <option value="5">5% rate</option>
                                <option value="12">12% rate</option>
                                <option value="13">13% ({globalSettings.taxType})</option>
                                <option value="18">18% ({globalSettings.taxType})</option>
                                <option value="28">28% rate</option>
                              </select>
                            </div>
                            <div className="col-span-1">
                              <input type="number" value={item.discountAmount} onChange={(e) => {
                                const copy = [...invoiceItems];
                                copy[idx].discountAmount = e.target.value;
                                setInvoiceItems(copy);
                              }} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-101" />
                            </div>
                            <div className="col-span-1 text-right">
                              <button type="button" onClick={() => {
                                const copy = [...invoiceItems];
                                copy.splice(idx, 1);
                                setInvoiceItems(copy);
                              }} className="text-rose-455 hover:text-rose-350">×</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-955 border border-slate-850 rounded text-xs space-y-1">
                      <div className="flex justify-between"><span>Subtotal:</span><span>{globalSettings.currency} {subTotal.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>{globalSettings.taxType} Tax:</span><span>{globalSettings.currency} {totalTax.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-1"><span>Payable Amount:</span><span>{globalSettings.currency} {totalAmount.toFixed(2)}</span></div>
                    </div>
                    
                    <div className="p-4 bg-slate-955 border border-slate-850 rounded space-y-2">
                      <label className="block text-[10px] text-slate-455">Bill Discount Amount</label>
                      <input type="number" value={invoiceBillDiscount} onChange={(e) => setInvoiceBillDiscount(e.target.value)} className="w-full bg-slate-955 border border-slate-800 rounded px-2 py-1" />
                    </div>
                  </div>

                  {/* split payments */}
                  <div className="border-t border-slate-800 pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-350">Log Received Payments (Nepal Gateways Ready)</h4>
                      <button type="button" onClick={addPaymentSplit} className="py-1 px-2.5 bg-slate-800 border border-slate-700 rounded">+ Split payment</button>
                    </div>

                    {invoicePayments.map((p, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-955 p-3 rounded border border-slate-850 items-center">
                        <input type="number" value={p.amount} onChange={(e) => updateSplitPayment(idx, "amount", e.target.value)} placeholder="Amount" className="col-span-3 bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-101" />
                        <select value={p.paymentMode} onChange={(e) => updateSplitPayment(idx, "paymentMode", e.target.value)} className="col-span-3 bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-101">
                          <option value="CASH">Cash (Rec Log)</option>
                          <option value="CARD">Card POS Swipe</option>
                          <option value="WALLET">eSewa Pay (Wallet)</option>
                          <option value="WALLET">Khalti Pay (Wallet)</option>
                          <option value="UPI">FonePay (QR Code)</option>
                          <option value="BANK_TRANSFER">ConnectIPS / Transfer</option>
                        </select>
                        <select value={p.paymentType} onChange={(e) => updateSplitPayment(idx, "paymentType", e.target.value)} className="col-span-3 bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-101">
                          <option value="FULL">Full</option>
                          <option value="ADVANCE">Advance deposit</option>
                        </select>
                        <input type="text" value={p.transactionId} onChange={(e) => updateSplitPayment(idx, "transactionId", e.target.value)} placeholder="Wallet Ref / Txn ID" className="col-span-2 bg-slate-955 border border-slate-800 rounded px-2 py-1 text-slate-101" />
                        <div className="col-span-1 text-right">
                          {invoicePayments.length > 1 && <button type="button" onClick={() => removePaymentSplit(idx)} className="text-rose-455">×</button>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-955 text-sm rounded shadow">
                    {loading ? "Billing..." : "Finalize Invoice (Deducts FEFO Stock)"}
                  </button>
                </div>
              )}
            </form>

            {printedInvoice && (
              <div className="bg-white text-slate-900 p-8 rounded-xl max-w-2xl mx-auto space-y-6 border border-slate-350 font-serif">
                <div className="flex justify-between border-b pb-4">
                  <div>
                    <h1 className="text-base font-bold uppercase">{printedInvoice.billingEntity.legalName}</h1>
                    <p className="text-[10px] text-slate-500 mt-1">{printedInvoice.billingEntity.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs uppercase text-slate-700 block">TAX INVOICE</span>
                    <span className="text-[10px] text-slate-500 block mt-1">Inv No: {printedInvoice.invoiceNumber}</span>
                  </div>
                </div>
                
                <div className="text-xs text-slate-650 flex justify-between">
                  <div>Patient: <strong>{printedInvoice.patient.name}</strong> ({printedInvoice.patient.mrn})</div>
                  <div>Clinic: {printedInvoice.clinic.name}</div>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b font-bold bg-slate-50">
                      <th className="py-2 px-1">Description</th>
                      <th className="py-2 px-1 text-center">Qty</th>
                      <th className="py-2 px-1 text-right">Price</th>
                      <th className="py-2 px-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printedInvoice.items.map((it: any) => (
                      <tr key={it.id} className="border-b border-slate-100">
                        <td className="py-2 px-1">{it.description}</td>
                        <td className="py-2 px-1 text-center">{it.quantity}</td>
                        <td className="py-2 px-1 text-right">{globalSettings.currency} {it.unitPrice.toFixed(2)}</td>
                        <td className="py-2 px-1 text-right">{globalSettings.currency} {(it.quantity * it.unitPrice - it.discountAmount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex flex-col items-end text-xs space-y-1">
                  <div>Gross Payable: <strong>{globalSettings.currency} {printedInvoice.totalAmount.toFixed(2)}</strong></div>
                </div>
                <div className="text-center print:hidden pt-2">
                  <button onClick={() => window.print()} className="py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs">Print invoice</button>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* 3.5 Tab: INVENTORY MANAGEMENT */}
      {activeTab === "inventory" && (
        !hasAccess("manage_inventory") ? renderRestrictedLock("Inventory Stock Ledger & purchases") : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md md:col-span-1 space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-455">Near Expiry Alert (60d)</h3>
                {inventoryAlerts.nearExpiry.map((b: any) => (
                  <div key={b.id} className="p-3 bg-rose-955/20 border border-rose-900/35 rounded text-xs">
                    <strong>{b.product.name}</strong><br />
                    <span className="text-[10px] text-slate-500">Batch: {b.batchNumber} | Expiry: {new Date(b.expiryDate).toLocaleDateString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md md:col-span-2 space-y-4">
              <form onSubmit={handlePurchaseEntry} className="space-y-3 bg-slate-950/20 border border-slate-800 p-4 rounded-lg">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-350">Log Supplier purchase Batch</h4>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <select required value={purchaseForm.productId} onChange={(e) => setPurchaseForm({ ...purchaseForm, productId: e.target.value })} className="col-span-2 bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5">
                    <option value="">-- Select Product --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.sku} • {p.name}</option>)}
                  </select>
                  <input type="text" required placeholder="Supplier" value={purchaseForm.supplier} onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })} className="bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5" />
                  <input type="text" required placeholder="Batch" value={purchaseForm.batchNumber} onChange={(e) => setPurchaseForm({ ...purchaseForm, batchNumber: e.target.value })} className="bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5" />
                  <input type="date" required value={purchaseForm.expiryDate} onChange={(e) => setPurchaseForm({ ...purchaseForm, expiryDate: e.target.value })} className="bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5" />
                  <input type="text" required placeholder="Invoice No" value={purchaseForm.invoiceNumber} onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })} className="bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5" />
                  <input type="number" required placeholder="Qty" value={purchaseForm.quantity} onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })} className="bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5" />
                  <input type="number" required placeholder="Cost" value={purchaseForm.cost} onChange={(e) => setPurchaseForm({ ...purchaseForm, cost: e.target.value })} className="bg-slate-955 border border-slate-800 rounded px-2.5 py-1.5" />
                </div>
                <button type="submit" disabled={loading} className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-955 rounded">
                  Log Purchase
                </button>
              </form>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default function StaffPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Front Desk Workspace...</div>}>
      <StaffDashboardContent />
    </Suspense>
  );
}
