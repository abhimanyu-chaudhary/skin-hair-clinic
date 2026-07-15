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
  TrendingDown,
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

  // Outflow Data Logs
  const [payouts, setPayouts] = useState<any[]>([]);
  const [wholesalerBills, setWholesalerBills] = useState<any[]>([]);

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
    baseSalary: "",
  });

  // 3. Staff Form State
  const [staffForm, setStaffForm] = useState({
    email: "",
    password: "",
    name: "",
    mobile: "",
    clinicId: "",
    baseSalary: "",
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

  // Salary Payout Form State
  const [salaryPayoutForm, setSalaryPayoutForm] = useState({
    employeeType: "DOCTOR",
    selectedEmployeeId: "",
    amount: "",
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear(),
    payoutDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Financial Report parameters
  const [reportDates, setReportDates] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [reportResult, setReportResult] = useState<any>(null);

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

  // Analytics Date Range States
  const [analyticsRange, setAnalyticsRange] = useState("Month");
  const [analyticsCustomDates, setAnalyticsCustomDates] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const getRangeDates = (range: string) => {
    const today = new Date();
    let start: Date | null = new Date();
    let end: Date | null = new Date();

    switch (range) {
      case "Today":
        start = new Date(today);
        break;
      case "Yesterday":
        start = new Date(today);
        start.setDate(today.getDate() - 1);
        end = new Date(start);
        break;
      case "Last 7 Days":
        start = new Date(today);
        start.setDate(today.getDate() - 6);
        break;
      case "Month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "Last Month":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "All Time":
        return { start: null, end: null };
      case "Custom":
        return { start: analyticsCustomDates.startDate, end: analyticsCustomDates.endDate };
      default:
        break;
    }
    return {
      start: start ? start.toISOString().split("T")[0] : null,
      end: end ? end.toISOString().split("T")[0] : null,
    };
  };

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

  // Load data based on activeTab update
  useEffect(() => {
    const { start, end } = getRangeDates(analyticsRange);
    fetchAnalytics(start, end);
    loadMasters();
    fetchSettings();
    if (activeTab === "outflows") {
      fetchPayouts();
      fetchWholesalerBills();
    }
    if (activeTab === "reports") {
      setReportResult(null);
    }
  }, [activeTab, analyticsRange]);

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
      baseSalary: "",
    });
    setStaffForm({ email: "", password: "", name: "", mobile: "", clinicId: "", baseSalary: "" });
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
    setSalaryPayoutForm({
      employeeType: "DOCTOR",
      selectedEmployeeId: "",
      amount: "",
      periodMonth: new Date().getMonth() + 1,
      periodYear: new Date().getFullYear(),
      payoutDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const fetchAnalytics = async (start?: string | null, end?: string | null) => {
    try {
      let url = "/api/analytics";
      if (start && end) {
        url += `?startDate=${start}&endDate=${end}`;
      }
      const res = await fetch(url);
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

  const fetchPayouts = async () => {
    try {
      const res = await fetch("/api/salaries");
      if (res.ok) setPayouts(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWholesalerBills = async () => {
    try {
      const res = await fetch("/api/wholesaler-bills");
      if (res.ok) setWholesalerBills(await res.json());
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
            baseSalary: staffForm.baseSalary,
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

  // Submit Salary Payout Log
  const handleSalaryPayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const { employeeType, selectedEmployeeId, amount, periodMonth, periodYear, payoutDate, notes } = salaryPayoutForm;

    if (!selectedEmployeeId || !amount) {
      setErrorMsg("Please select an employee and specify the payout amount.");
      return;
    }

    setLoading(true);

    let empName = "";
    if (employeeType === "DOCTOR") {
      const doc = doctors.find((d) => d.userId === selectedEmployeeId);
      if (doc) empName = doc.name;
    } else {
      const st = staffs.find((s) => s.userId === selectedEmployeeId);
      if (st) empName = st.name;
    }

    try {
      const res = await fetch("/api/salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          employeeType,
          employeeName: empName,
          amount,
          periodMonth,
          periodYear,
          payoutDate,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record salary log");

      setSuccessMsg("Salary payout recorded successfully as a business outflow!");
      cancelEdits();
      fetchPayouts();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Date range Report
  const calculateFinancialReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch(`/api/reports/financial?startDate=${reportDates.startDate}&endDate=${reportDates.endDate}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to calculate report");
      setReportResult(data);
      setSuccessMsg("Financial statement generated successfully!");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Export CSV
  const handleExportXLS = () => {
    if (!reportResult) return;
    const { summary, inflowDetail, salaryDetail, wholesalerDetail } = reportResult;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "FINANCIAL STATEMENT SUMMARY\n";
    csvContent += `Period,${reportResult.startDate} to ${reportResult.endDate}\n`;
    csvContent += `Gross Inflows (Patient payments),${summary.totalInflow}\n`;
    csvContent += `Salary Outflows,${summary.totalSalaryOutflow}\n`;
    csvContent += `Wholesaler Stock Outflows,${summary.totalWholesalerOutflow}\n`;
    csvContent += `Total Outflows,${summary.totalOutflow}\n`;
    csvContent += `Net Margin,${summary.netRevenue}\n\n`;

    csvContent += "PATIENT INFLOW DETAILS\n";
    csvContent += "Date,Patient,MRN,Invoice Number,Payment Mode,Amount\n";
    inflowDetail.forEach((row: any) => {
      csvContent += `${new Date(row.date).toLocaleDateString()},"${row.patientName}",${row.patientMrn},${row.invoiceNumber},${row.paymentMode},${row.amount}\n`;
    });

    csvContent += "\nSALARY OUTFLOW DETAILS\n";
    csvContent += "Date,Employee,Role,Period,Amount\n";
    salaryDetail.forEach((row: any) => {
      csvContent += `${new Date(row.payoutDate).toLocaleDateString()},"${row.employeeName}",${row.employeeType},${row.period},${row.amount}\n`;
    });

    csvContent += "\nWHOLESALER STOCK OUTFLOW DETAILS\n";
    csvContent += "Date,Wholesaler,Invoice Number,Amount\n";
    wholesalerDetail.forEach((row: any) => {
      csvContent += `${new Date(row.billDate).toLocaleDateString()},"${row.wholesaler}",${row.invoiceNumber},${row.amount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${reportDates.startDate}_to_${reportDates.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF via Print Window
  const handleExportPDF = () => {
    if (!reportResult) return;
    const { summary, inflowDetail, salaryDetail, wholesalerDetail } = reportResult;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Financial Statement Ledger</title>
          <style>
            body { font-family: sans-serif; color: #1e293b; padding: 40px; }
            h1 { font-size: 20px; color: #0f172a; margin-bottom: 5px; }
            h2 { font-size: 14px; color: #475569; font-weight: normal; margin-top: 0; margin-bottom: 30px; }
            .kpi-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .kpi-card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc; }
            .kpi-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .kpi-value { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 11px; }
            th { background: #f1f5f9; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: left; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
            .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>${globalSettingsForm.businessName}</h1>
          <h2>Financial Statement: ${reportDates.startDate} to ${reportDates.endDate}</h2>

          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Gross Inflow</div>
              <div class="kpi-value">${globalSettingsForm.currency} ${summary.totalInflow.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Salary Outflow</div>
              <div class="kpi-value">${globalSettingsForm.currency} ${summary.totalSalaryOutflow.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Stock Outflow</div>
              <div class="kpi-value">${globalSettingsForm.currency} ${summary.totalWholesalerOutflow.toLocaleString()}</div>
            </div>
            <div class="kpi-card" style="border-color: #cbd5e1; background: #f0fdf4;">
              <div class="kpi-label">Net Balance</div>
              <div class="kpi-value" style="color: #16a34a;">${globalSettingsForm.currency} ${summary.netRevenue.toLocaleString()}</div>
            </div>
          </div>

          <div class="section-title">Inflow Details (Patient Payments)</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>MRN</th>
                <th>Invoice</th>
                <th>Mode</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${inflowDetail.map((p: any) => `
                <tr>
                  <td>${new Date(p.date).toLocaleDateString()}</td>
                  <td>${p.patientName}</td>
                  <td>${p.patientMrn}</td>
                  <td>${p.invoiceNumber}</td>
                  <td>${p.paymentMode}</td>
                  <td class="text-right">${globalSettingsForm.currency} ${p.amount.toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="section-title">Outflow Details: Salary Payouts</div>
          <table>
            <thead>
              <tr>
                <th>Payout Date</th>
                <th>Employee</th>
                <th>Role</th>
                <th>Period</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${salaryDetail.map((s: any) => `
                <tr>
                  <td>${new Date(s.payoutDate).toLocaleDateString()}</td>
                  <td>${s.employeeName}</td>
                  <td>${s.employeeType}</td>
                  <td>${s.period}</td>
                  <td class="text-right">${globalSettingsForm.currency} ${s.amount.toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="section-title">Outflow Details: Wholesaler Billings</div>
          <table>
            <thead>
              <tr>
                <th>Bill Date</th>
                <th>Wholesaler</th>
                <th>Invoice Number</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${wholesalerDetail.map((w: any) => `
                <tr>
                  <td>${new Date(w.billDate).toLocaleDateString()}</td>
                  <td>${w.wholesaler}</td>
                  <td>${w.invoiceNumber}</td>
                  <td class="text-right">${globalSettingsForm.currency} ${w.amount.toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
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
      baseSalary: d.baseSalary ? d.baseSalary.toString() : "",
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
      baseSalary: s.baseSalary ? s.baseSalary.toString() : "",
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

  // Selected Employee base salary auto fill
  const handleEmployeePayoutSelect = (empId: string) => {
    let baseSalaryAmount = "";
    if (salaryPayoutForm.employeeType === "DOCTOR") {
      const doc = doctors.find((d) => d.userId === empId);
      if (doc && doc.baseSalary) baseSalaryAmount = doc.baseSalary.toString();
    } else {
      const st = staffs.find((s) => s.userId === empId);
      if (st && st.baseSalary) baseSalaryAmount = st.baseSalary.toString();
    }
    setSalaryPayoutForm({
      ...salaryPayoutForm,
      selectedEmployeeId: empId,
      amount: baseSalaryAmount,
    });
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
          { id: "outflows", label: "Expense Outflows", icon: TrendingDown },
          { id: "reports", label: "Financial Reports", icon: BarChart },
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
          {/* Date Range Selector Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {["Today", "Yesterday", "Last 7 Days", "Month", "Last Month", "All Time", "Custom"].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => {
                    setAnalyticsRange(range);
                    if (range !== "Custom") {
                      const { start, end } = getRangeDates(range);
                      fetchAnalytics(start, end);
                    }
                  }}
                  className={`py-1.5 px-3 rounded text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    analyticsRange === range
                      ? "bg-emerald-600 text-slate-950 font-bold"
                      : "bg-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white border border-slate-800"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {analyticsRange === "Custom" && (
              <div className="flex items-center gap-2 text-xs">
                <div>
                  <input
                    type="date"
                    value={analyticsCustomDates.startDate}
                    onChange={(e) => setAnalyticsCustomDates({ ...analyticsCustomDates, startDate: e.target.value })}
                    className="bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-slate-101 font-medium"
                  />
                </div>
                <span className="text-slate-500">to</span>
                <div>
                  <input
                    type="date"
                    value={analyticsCustomDates.endDate}
                    onChange={(e) => setAnalyticsCustomDates({ ...analyticsCustomDates, endDate: e.target.value })}
                    className="bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-slate-101 font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fetchAnalytics(analyticsCustomDates.startDate, analyticsCustomDates.endDate)}
                  className="py-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded font-bold uppercase text-[10px] tracking-wider cursor-pointer"
                >
                  Filter
                </button>
              </div>
            )}
          </div>

          {/* KPI Dashboard Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 animate-fadeIn">
            {/* KPI: Gross Invoiced Revenue */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gross Invoiced</span>
              <h4 className="text-lg font-bold text-white mt-3">
                {globalSettingsForm.currency} {(analytics.kpis?.totalRevenue || 0).toLocaleString()}
              </h4>
              <span className="text-[9px] text-slate-500 mt-1">Total revenue generated by issues</span>
            </div>

            {/* KPI: Total Inflow (Gross Collections) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg border-l-emerald-600 border-l-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Inflow</span>
              <h4 className="text-lg font-bold text-emerald-450 mt-3">
                {globalSettingsForm.currency} {(analytics.kpis?.totalInflow || 0).toLocaleString()}
              </h4>
              <span className="text-[9px] text-slate-500 mt-1">Gross cash and wallet collections received</span>
            </div>

            {/* KPI: Pharmacy Wholesaler Outflow */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg border-l-rose-500 border-l-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pharmacy Outflow</span>
              <h4 className="text-lg font-bold text-rose-500 mt-3">
                -{globalSettingsForm.currency} {(analytics.kpis?.pharmacyOutflow || 0).toLocaleString()}
              </h4>
              <span className="text-[9px] text-slate-500 mt-1">Payments made to drug wholesalers</span>
            </div>

            {/* KPI: Salary Outflow */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg border-l-rose-500 border-l-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Salary Outflow</span>
              <h4 className="text-lg font-bold text-rose-500 mt-3">
                -{globalSettingsForm.currency} {(analytics.kpis?.salaryOutflow || 0).toLocaleString()}
              </h4>
              <span className="text-[9px] text-slate-500 mt-1">Total base salary payments logged</span>
            </div>

            {/* KPI: Net Profit / Margin */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg border-emerald-900/30">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Net margin</span>
              <h4 className={`text-lg font-bold mt-3 ${(analytics.kpis?.netMargin || 0) >= 0 ? "text-emerald-450" : "text-rose-500"}`}>
                {globalSettingsForm.currency} {(analytics.kpis?.netMargin || 0).toLocaleString()}
              </h4>
              <span className="text-[9px] text-slate-500 mt-1">Net inflow minus recorded outflows</span>
            </div>

            {/* KPI: Total Patients Registered */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Patients Added</span>
              <h4 className="text-lg font-bold text-white mt-3">
                {analytics.kpis?.totalPatients || 0} Patients
              </h4>
              <span className="text-[9px] text-slate-500 mt-1">New MRNs enabled during period</span>
            </div>

            {/* KPI: Total Appointments */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Appointments</span>
              <h4 className="text-lg font-bold text-white mt-3">
                {analytics.kpis?.totalAppointments || 0} Visits
              </h4>
              <span className="text-[9px] text-slate-500 mt-1">Total scheduled/completed sessions</span>
            </div>

            {/* KPI: Stock Asset Valuation */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stock assets value</span>
              <h4 className="text-lg font-bold text-purple-400 mt-3">
                {globalSettingsForm.currency} {(analytics.kpis?.inventoryValuation || 0).toLocaleString()}
              </h4>
              <span className="text-[9px] text-slate-500 mt-1">Current total value of physical stock asset</span>
            </div>
          </div>

          {/* Alerts Section (Expiry & Shortage Lists) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Near Expiry Alert list */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-455 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-455" /> Near Expiry Alert (60 Days)
              </h3>
              {(!analytics.nearExpiryAlerts || analytics.nearExpiryAlerts.length === 0) ? (
                <p className="text-slate-550 text-xs py-4 text-center">No medicine batches expiring in the next 60 days.</p>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                        <th className="py-2 px-1">SKU</th>
                        <th className="py-2 px-1">Product Name</th>
                        <th className="py-2 px-1">Batch</th>
                        <th className="py-2 px-1">Qty</th>
                        <th className="py-2 px-1">Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {analytics.nearExpiryAlerts.map((b: any) => (
                        <tr key={b.id}>
                          <td className="py-2 px-1 font-mono text-[10px]">{b.sku}</td>
                          <td className="py-2 px-1 font-bold text-white">{b.name}</td>
                          <td className="py-2 px-1 font-mono">{b.batchNumber}</td>
                          <td className="py-2 px-1">{b.quantity}</td>
                          <td className="py-2 px-1 text-rose-455 font-bold">{new Date(b.expiryDate).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Stock Shortage Alert list */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Stock Shortage Alert (Qty &lt; 5)
              </h3>
              {(!analytics.stockShortageAlerts || analytics.stockShortageAlerts.length === 0) ? (
                <p className="text-slate-550 text-xs py-4 text-center">No products running below 5 units in stock.</p>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                        <th className="py-2 px-1">SKU</th>
                        <th className="py-2 px-1">Product Name</th>
                        <th className="py-2 px-1">Stock Level</th>
                        <th className="py-2 px-1">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {analytics.stockShortageAlerts.map((p: any) => (
                        <tr key={p.id}>
                          <td className="py-2 px-1 font-mono text-[10px]">{p.sku}</td>
                          <td className="py-2 px-1 font-bold text-white">{p.name}</td>
                          <td className="py-2 px-1 font-bold text-rose-500">{p.totalStock} Units</td>
                          <td className="py-2 px-1">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-955/20 border border-rose-900/30 text-rose-455">
                              CRITICAL SHORTAGE
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

            <button type="submit" disabled={loading} className="w-full py-2 bg-emerald-600 hover:bg-emerald-555 font-bold text-slate-955 text-xs rounded">
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
                    <h4 className="font-bold text-slate-101 flex items-center gap-2">
                      {c.name}
                      <button onClick={() => startEditClinic(c)} className="p-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-emerald-450 border border-slate-755 rounded cursor-pointer" title="Edit Clinic">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteWithPassword("Clinic Branch", c.id, `/api/clinics/${c.id}`)} className="p-1 bg-slate-850 hover:bg-rose-950 text-rose-500 hover:text-rose-450 border border-slate-750 rounded cursor-pointer" title="Delete Clinic Branch">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </h4>
                    <p className="text-slate-550 text-[10px] mt-0.5">{c.address}</p>
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

              <div className="col-span-2">
                <label className="block text-[10px] text-slate-400 mb-0.5">Monthly Base Salary</label>
                <input type="number" value={doctorForm.baseSalary} onChange={(e) => setDoctorForm({ ...doctorForm, baseSalary: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-101" placeholder="Keep empty if not applicable" />
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
                    <h4 className="font-bold text-slate-101 flex items-center gap-2">
                      {d.name}
                      <button onClick={() => startEditDoctor(d)} className="p-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-emerald-455 border border-slate-750 rounded cursor-pointer" title="Edit Doctor Profile">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteWithPassword("Doctor", d.id, `/api/doctors/${d.id}`)} className="p-1 bg-slate-850 hover:bg-rose-950 text-rose-500 hover:text-rose-455 border border-slate-750 rounded cursor-pointer" title="Delete Doctor Profile">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </h4>
                    <p className="text-slate-550 text-[10px] mt-0.5">{d.qualifications} ({d.specializations})</p>
                    <p className="text-[10px] text-slate-455 mt-1">
                      Branch: <strong>{d.clinic.name}</strong> • NMC: {d.regNumber} • Salary: {d.baseSalary ? `${globalSettingsForm.currency} ${d.baseSalary.toLocaleString()}` : "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-emerald-955/45 border border-emerald-900/30 text-emerald-455 rounded-[4px] font-bold">
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

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Monthly Base Salary</label>
                <input type="number" value={staffForm.baseSalary} onChange={(e) => setStaffForm({ ...staffForm, baseSalary: e.target.value })} className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101" placeholder="Keep empty if not applicable" />
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
                  { key: "record_wholesaler_bills", label: "Record Wholesaler Billings (Pharmacy Outflow)" },
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
                      <h4 className="font-bold text-slate-101 flex items-center gap-2">
                        {s.name}
                        <button onClick={() => startEditStaff(s)} className="p-1 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-emerald-455 border border-slate-755 rounded cursor-pointer" title="Edit Staff Profile">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteWithPassword("Staff Account", s.id, `/api/staff/${s.id}`)} className="p-1 bg-slate-850 hover:bg-rose-950 text-rose-500 hover:text-rose-455 border border-slate-750 rounded cursor-pointer" title="Delete Staff Account">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </h4>
                      <p className="text-slate-550 text-[10px] mt-0.5 font-mono">Email: {s.user?.email}</p>
                      <p className="text-[10px] text-slate-450 mt-1">
                        Branch: <strong>{s.clinic?.name}</strong> • Phone: {s.mobile} • Salary: {s.baseSalary ? `${globalSettingsForm.currency} ${s.baseSalary.toLocaleString()}` : "N/A"}
                      </p>
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
                  <label className="block text-[9px] text-slate-455 mb-0.5">Supplier Name *</label>
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
                      <button onClick={() => handleDeleteWithPassword("Billing Entity", be.id, `/api/billing-entities?id=${be.id}`)} className="p-1 bg-slate-850 hover:bg-rose-950 text-rose-500 hover:text-rose-455 border border-slate-750 rounded transition-all cursor-pointer" title="Delete Billing Entity">
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

      {/* Tab: EXPENSE OUTFLOWS */}
      {activeTab === "outflows" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn text-xs">
          {/* Salary Payout Log Form */}
          <form onSubmit={handleSalaryPayoutSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-455" /> Record Salary Payout
            </h3>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Employee Type *</label>
              <select
                value={salaryPayoutForm.employeeType}
                onChange={(e) => setSalaryPayoutForm({ ...salaryPayoutForm, employeeType: e.target.value, selectedEmployeeId: "", amount: "" })}
                className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101"
              >
                <option value="DOCTOR">Doctor / Specialist</option>
                <option value="STAFF">Front-Desk Staff</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Select Employee *</label>
              <select
                required
                value={salaryPayoutForm.selectedEmployeeId}
                onChange={(e) => handleEmployeePayoutSelect(e.target.value)}
                className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101"
              >
                <option value="">-- Choose Employee --</option>
                {salaryPayoutForm.employeeType === "DOCTOR"
                  ? doctors.map((d) => (
                      <option key={d.id} value={d.userId}>{d.name} {d.baseSalary ? `(Salary: Rs. ${d.baseSalary})` : "(No Base Salary Set)"}</option>
                    ))
                  : staffs.map((s) => (
                      <option key={s.id} value={s.userId}>{s.name} {s.baseSalary ? `(Salary: Rs. ${s.baseSalary})` : "(No Base Salary Set)"}</option>
                    ))
                }
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Payout Month *</label>
                <select
                  value={salaryPayoutForm.periodMonth}
                  onChange={(e) => setSalaryPayoutForm({ ...salaryPayoutForm, periodMonth: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{new Date(2026, m - 1).toLocaleString("en-US", { month: "long" })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Payout Year *</label>
                <input
                  type="number"
                  required
                  value={salaryPayoutForm.periodYear}
                  onChange={(e) => setSalaryPayoutForm({ ...salaryPayoutForm, periodYear: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Amount Paid ({globalSettingsForm.currency}) *</label>
                <input
                  type="number"
                  required
                  value={salaryPayoutForm.amount}
                  onChange={(e) => setSalaryPayoutForm({ ...salaryPayoutForm, amount: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Payout Date *</label>
                <input
                  type="date"
                  required
                  value={salaryPayoutForm.payoutDate}
                  onChange={(e) => setSalaryPayoutForm({ ...salaryPayoutForm, payoutDate: e.target.value })}
                  className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Payment Reference / Notes</label>
              <input
                type="text"
                value={salaryPayoutForm.notes}
                onChange={(e) => setSalaryPayoutForm({ ...salaryPayoutForm, notes: e.target.value })}
                className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101"
                placeholder="Bank Txn ID, Cash Receipt No..."
              />
            </div>

            <button type="submit" disabled={loading} className="w-full py-2 bg-rose-600 hover:bg-rose-500 font-bold text-white rounded transition-all">
              Record Salary Payout
            </button>
          </form>

          {/* Outflow logs lists */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payout log history */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-355 border-b border-slate-850 pb-2">Salary Payout History</h3>
              <div className="divide-y divide-slate-850 max-h-[220px] overflow-y-auto">
                {payouts.length === 0 ? (
                  <p className="text-slate-550 py-4 text-center">No salary payouts logged yet.</p>
                ) : (
                  payouts.map((p) => (
                    <div key={p.id} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-white">{p.employeeName}</strong> ({p.employeeType})<br />
                        <span className="text-[10px] text-slate-500">Period: {p.periodMonth}/{p.periodYear} • Notes: {p.notes || "-"}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-rose-455">-{globalSettingsForm.currency} {p.amount.toLocaleString()}</span>
                        <p className="text-[9px] text-slate-500 mt-0.5">{new Date(p.payoutDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Wholesaler bills logged */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-355 border-b border-slate-850 pb-2">Pharmacy Wholesaler Bills</h3>
              <div className="divide-y divide-slate-850 max-h-[220px] overflow-y-auto">
                {wholesalerBills.length === 0 ? (
                  <p className="text-slate-550 py-4 text-center">No wholesaler bills recorded yet.</p>
                ) : (
                  wholesalerBills.map((w) => (
                    <div key={w.id} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-white">{w.wholesaler}</strong> (Invoice: {w.invoiceNumber})<br />
                        <span className="text-[10px] text-slate-500">Notes: {w.notes || "-"}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-rose-455">-{globalSettingsForm.currency} {w.amount.toLocaleString()}</span>
                        <p className="text-[9px] text-slate-500 mt-0.5">{new Date(w.billDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: FINANCIAL REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-6 animate-fadeIn text-xs">
          <form onSubmit={calculateFinancialReport} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={reportDates.startDate}
                onChange={(e) => setReportDates({ ...reportDates, startDate: e.target.value })}
                className="bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101 font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={reportDates.endDate}
                onChange={(e) => setReportDates({ ...reportDates, endDate: e.target.value })}
                className="bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-101 font-medium"
              />
            </div>
            <button type="submit" disabled={loading} className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-955 rounded shadow cursor-pointer">
              Generate Ledger
            </button>
            {reportResult && (
              <div className="flex gap-2 ml-auto">
                <button type="button" onClick={handleExportXLS} className="py-2 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded cursor-pointer font-bold">
                  Export XLS (CSV)
                </button>
                <button type="button" onClick={handleExportPDF} className="py-2 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded cursor-pointer font-bold">
                  Export PDF / Print
                </button>
              </div>
            )}
          </form>

          {reportResult && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gross Inflow (Invoices)</span>
                  <h4 className="text-xl font-bold text-emerald-450 mt-3">
                    {globalSettingsForm.currency} {reportResult.summary.totalInflow.toLocaleString()}
                  </h4>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Salary Outflows</span>
                  <h4 className="text-xl font-bold text-rose-500 mt-3">
                    {globalSettingsForm.currency} {reportResult.summary.totalSalaryOutflow.toLocaleString()}
                  </h4>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Wholesaler Stock Outflows</span>
                  <h4 className="text-xl font-bold text-rose-500 mt-3">
                    {globalSettingsForm.currency} {reportResult.summary.totalWholesalerOutflow.toLocaleString()}
                  </h4>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between shadow-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Net Business Balance</span>
                  <h4 className={`text-xl font-bold mt-3 ${reportResult.summary.netRevenue >= 0 ? "text-emerald-450" : "text-rose-500"}`}>
                    {globalSettingsForm.currency} {reportResult.summary.netRevenue.toLocaleString()}
                  </h4>
                </div>
              </div>

              {/* Inflow logs */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 border-b border-slate-850 pb-2">Patient Payments (Inflow Ledger)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase bg-slate-900/40">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Patient</th>
                        <th className="py-2.5 px-3">MRN</th>
                        <th className="py-2.5 px-3">Invoice Number</th>
                        <th className="py-2.5 px-3">Payment Mode</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {reportResult.inflowDetail.map((row: any) => (
                        <tr key={row.id}>
                          <td className="py-2 px-3">{new Date(row.date).toLocaleDateString()}</td>
                          <td className="py-2 px-3 text-white font-medium">{row.patientName}</td>
                          <td className="py-2 px-3 font-mono">{row.patientMrn}</td>
                          <td className="py-2 px-3">{row.invoiceNumber}</td>
                          <td className="py-2 px-3">{row.paymentMode}</td>
                          <td className="py-2 px-3 text-right text-emerald-450 font-bold">{globalSettingsForm.currency} {row.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
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
            <div className="space-y-4 bg-slate-955/35 border border-slate-850 p-5 rounded-lg">
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

            <div className="space-y-4 bg-slate-955/35 border border-slate-850 p-5 rounded-lg">
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

            <div className="space-y-4 bg-slate-955/35 border border-slate-850 p-5 rounded-lg md:col-span-2">
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

      {/* 9. Tab: SECURITY SETTINGS */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            {/* Global Deletion Password Override */}
            <form onSubmit={handleSaveDeletionPassword} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-855 pb-2 flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-455" /> Deletion Profile Password Settings
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-855 pb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-400" /> Administrative Password Reset Console
              </h3>
              <p className="text-xs text-slate-455">
                Change or reset the login password of any doctor, front-desk staff member, patient profile, or administrator account.
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
                  <label className="block text-[10px] text-slate-400 mb-0.5">Search Patient ID/MRN/Name/Mobile *</label>
                  <input
                    type="text"
                    value={patientSearchQuery}
                    onChange={(e) => handlePatientSearch(e.target.value)}
                    placeholder="Type name, MRN, or mobile..."
                    className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-slate-101"
                  />
                  {patientSearchResults.length > 0 && (
                    <div className="space-y-1 text-xs max-h-48 overflow-y-auto border border-slate-800 rounded p-2 bg-slate-955 divide-y divide-slate-800">
                      {patientSearchResults.map((p) => {
                        const isSelected = passwordResetForm.selectedUserId === p.userId;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setPasswordResetForm({ ...passwordResetForm, selectedUserId: p.userId })}
                            className={`p-2 rounded flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? "bg-emerald-600/10 border border-emerald-500/30 text-emerald-450 font-semibold"
                                : "hover:bg-slate-900 border border-transparent text-slate-300 hover:text-white"
                            }`}
                          >
                            <div>
                              <strong className="block text-white text-xs">{p.name}</strong>
                              <span className="text-[10px] text-slate-500">MRN: {p.mrn} | Mobile: {p.mobile || "N/A"}</span>
                            </div>
                            {isSelected ? (
                              <span className="text-[9px] bg-emerald-600 text-slate-950 px-1.5 py-0.5 rounded font-bold uppercase">Selected</span>
                            ) : (
                              <span className="text-[9px] text-slate-500">Click to Select</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
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
