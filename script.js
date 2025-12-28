(() => {
  "use strict";

  // --- Print (global if you still call it from HTML somewhere) ---
  window.printCertificate = function () {
    window.print();
  };

  // ---------------- Certificate Manager ----------------
  class CertificateManager {
    constructor() {
      this.editableFields = document.querySelectorAll(".editable");
      this.init();
    }

    init() {
      this.loadSavedData();
      this.attachEventListeners();
      this.updateTimestamp();
    }

    updateTimestamp() {
      const now = new Date();
      const timestamp =
        now.toLocaleDateString() + ", " +
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();

      const el = document.querySelector(".timestamp");
      if (el) el.textContent = timestamp;
    }

    loadSavedData() {
      this.editableFields.forEach((field, index) => {
        const savedValue = localStorage.getItem(`certificate_field_${index}`);
        if (savedValue && savedValue !== "Click to edit") field.textContent = savedValue;
      });
    }

    saveFieldData(field, index) {
      const value = field.textContent.trim();
      if (value && value !== "Click to edit") localStorage.setItem(`certificate_field_${index}`, value);
    }

    attachEventListeners() {
      this.editableFields.forEach((field, index) => {
        field.addEventListener("input", () => this.saveFieldData(field, index));
        field.addEventListener("focus", () => this.onFieldFocus(field));
        field.addEventListener("blur", () => this.onFieldBlur(field));
        field.addEventListener("keydown", (e) => this.handleKeyboardEvents(e, field));
      });
    }

    onFieldFocus(field) {
      if (field.textContent === "Click to edit") field.textContent = "";
      if (field.textContent.trim() !== "") this.selectAllText(field);
    }

    onFieldBlur(field) {
      field.textContent = field.textContent.trim();
    }

    handleKeyboardEvents(e, field) {
      if (e.key === "Enter") {
        e.preventDefault();
        this.moveToNextField(field);
      }
      if (e.key === "Escape") field.blur();
      if (e.ctrlKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        this.selectAllText(field);
      }
    }

    selectAllText(field) {
      const range = document.createRange();
      range.selectNodeContents(field);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }

    moveToNextField(currentField) {
      const currentIndex = Array.from(this.editableFields).indexOf(currentField);
      const nextIndex = (currentIndex + 1) % this.editableFields.length;
      this.editableFields[nextIndex].focus();
    }

    clearAllData() {
      if (!confirm("Are you sure you want to clear all certificate data?")) return;
      this.editableFields.forEach((field, index) => {
        field.textContent = "";
        localStorage.removeItem(`certificate_field_${index}`);
      });
    }

    exportData() {
      const data = {
        timestamp: document.querySelector(".timestamp")?.textContent || "",
        academicYear: document.querySelector(".tc-info .field-value")?.textContent || "",
        schoolCode: document.querySelector(".school-code .field-value")?.textContent || "",
        fields: {},
      };

      this.editableFields.forEach((field, index) => {
        const cell = field.closest(".field-cell");
        const fieldNumber = cell?.querySelector(".field-number")?.textContent || `Field ${index + 1}`;
        const label = (cell?.innerText || `Field ${index + 1}`).replace(field.textContent, "").trim();

        data.fields[fieldNumber] = { label, value: field.textContent.trim() };
      });

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `certificate_export.json`;
      link.click();
    }
  }

  function setupAutoSave() {
    setInterval(() => {
      document.querySelectorAll(".editable").forEach((field, index) => {
        const value = field.textContent.trim();
        if (value && value !== "Click to edit") localStorage.setItem(`certificate_field_${index}`, value);
      });
    }, 30000);
  }

  // ---------------- Supabase (CDN) ----------------
  // Avoid name "supabase" for your client to prevent redeclare/conflicts with the global library object. [web:9]
  const SUPABASE_URL = "https://alpvcqrdlwuoeoibrqva.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscHZjcXJkbHd1b2VvaWJycXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MTk1MDEsImV4cCI6MjA2NzA5NTUwMX0.2VBdsRGtvd9xE6PmVpas3CG0bAKTXr0BzgiARGUeTYo";

  // Create ONLY ONE client instance for the whole page. [web:8]
  const { createClient } = window.supabase;
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function saveUserInfo() {
    const name = document.getElementById("userName")?.value.trim();
    const phone = document.getElementById("userPhone")?.value.trim();

    if (!name || !phone) {
      alert("Please enter both your name and phone number.");
      return;
    }

    const { error } = await supabaseClient.from("userInfo").insert([
      { userName: name, phoneNumber: phone },
    ]);

    if (error) {
      console.error("Supabase Insert Error:", error);
      alert("Failed to save. Check console for details.");
      return;
    }

    localStorage.setItem("userName", name);
    localStorage.setItem("userPhone", phone);
    const dlg = document.getElementById("userInfoDialog");
    if (dlg) dlg.style.display = "none";
  }

  function showUserInfoDialogIfNeeded() {
    const hasUserInfo = localStorage.getItem("userName") && localStorage.getItem("userPhone");
    const dlg = document.getElementById("userInfoDialog");
    if (dlg) dlg.style.display = hasUserInfo ? "none" : "flex";
  }

  // ---------------- App init ----------------
  document.addEventListener("DOMContentLoaded", () => {
    // Certificate logic
    const certificateManager = new CertificateManager();
    setupAutoSave();

    // Modal logic
    showUserInfoDialogIfNeeded();
    document.getElementById("saveUserBtn")?.addEventListener("click", saveUserInfo);

    // Buttons
    document.getElementById("printBtn")?.addEventListener("click", window.printCertificate);

    // Shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        window.printCertificate();
      }
      if (e.ctrlKey && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        certificateManager.exportData();
      }
      if (e.ctrlKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        certificateManager.clearAllData();
      }
      if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        alert("Certificate data is automatically saved!");
      }
    });

    // Fade-in
    document.body.style.opacity = "0";
    setTimeout(() => {
      document.body.style.transition = "opacity 0.5s ease";
      document.body.style.opacity = "1";
    }, 100);
  });
})();
