// Certificate Management System - Complete Version
class CertificateManager {
  constructor() {
    this.editableFields = document.querySelectorAll(".editable")
    this.init()
  }

  init() {
    this.loadSavedData()
    this.attachEventListeners()
    this.updateTimestamp()
  }

  // Update timestamp to current date/time
  updateTimestamp() {
    const now = new Date();
    const timestamp =
      now.toLocaleDateString() + ", " +
      now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }).toUpperCase(); // Converts AM/PM to uppercase

    const timestampElement = document.querySelector(".timestamp");
    if (timestampElement) {
      timestampElement.textContent = timestamp;
    }
  }



  // Load saved data from localStorage
  loadSavedData() {
    this.editableFields.forEach((field, index) => {
      const savedValue = localStorage.getItem(`certificate_field_${index}`)
      if (savedValue && savedValue !== "Click to edit") {
        field.textContent = savedValue
      }
    })
  }

  // Save data to localStorage
  saveFieldData(field, index) {
    const value = field.textContent.trim()
    if (value && value !== "Click to edit") {
      localStorage.setItem(`certificate_field_${index}`, value)
    }
  }

  // Attach event listeners to editable fields
  attachEventListeners() {
    this.editableFields.forEach((field, index) => {
      // Save on input
      field.addEventListener("input", () => {
        this.saveFieldData(field, index)
      })

      // Handle focus events
      field.addEventListener("focus", () => {
        this.onFieldFocus(field)
      })

      // Handle blur events
      field.addEventListener("blur", () => {
        this.onFieldBlur(field)
      })

      // Handle keyboard events
      field.addEventListener("keydown", (e) => {
        this.handleKeyboardEvents(e, field)
      })
    })
  }

  // Handle field focus
  onFieldFocus(field) {
    // Clear placeholder text
    if (field.textContent === "Click to edit") {
      field.textContent = ""
    }

    // Select all text on focus for easy editing
    if (field.textContent.trim() !== "") {
      this.selectAllText(field)
    }
  }

  // Handle field blur
  onFieldBlur(field) {
    // Trim whitespace
    field.textContent = field.textContent.trim()
  }

  // Handle keyboard events
  handleKeyboardEvents(e, field) {
    // Enter key - move to next field
    if (e.key === "Enter") {
      e.preventDefault()
      this.moveToNextField(field)
    }

    // Escape key - blur current field
    if (e.key === "Escape") {
      field.blur()
    }

    // Ctrl+A - select all text
    if (e.ctrlKey && e.key === "a") {
      e.preventDefault()
      this.selectAllText(field)
    }
  }

  // Select all text in a field
  selectAllText(field) {
    const range = document.createRange()
    range.selectNodeContents(field)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  }

  // Move to next editable field
  moveToNextField(currentField) {
    const currentIndex = Array.from(this.editableFields).indexOf(currentField)
    const nextIndex = (currentIndex + 1) % this.editableFields.length
    this.editableFields[nextIndex].focus()
  }

  // Clear all data
  clearAllData() {
    if (confirm("Are you sure you want to clear all certificate data?")) {
      this.editableFields.forEach((field, index) => {
        field.textContent = ""
        localStorage.removeItem(`certificate_field_${index}`)
      })
    }
  }

  // Export data as JSON
  exportData() {
    const data = {
      timestamp: document.querySelector(".timestamp")?.textContent,
      tcNumber: document.querySelector(".tc-info .field-value")?.textContent,
      academicYear: document.querySelectorAll(".tc-info .field-value")[1]?.textContent,
      schoolCode: document.querySelector(".school-code .field-value")?.textContent,
      fields: {},
    }

    this.editableFields.forEach((field, index) => {
      const cell = field.closest(".field-cell")
      const fieldNumber = cell?.querySelector(".field-number")?.textContent || `Field ${index + 1}`
      const fieldText = cell?.textContent.split(field.textContent)[0] || `Field ${index + 1}`

      data.fields[fieldNumber] = {
        label: fieldText.replace(fieldNumber, "").trim(),
        value: field.textContent,
      }
    })

    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(dataBlob)
    link.download = `certificate_${data.tcNumber || "data"}.json`
    link.click()
  }
}

// Enhanced Print functionality for single page
function printCertificate() {
  // Simply trigger the browser's print dialog
  window.print()
}

// PDF Download functionality - Simple and reliable
function downloadPDF() {
  // Show loading indicator
  const downloadBtn = document.querySelector(".download-btn")
  const originalText = downloadBtn.textContent
  downloadBtn.textContent = "📄 Generating PDF..."
  downloadBtn.disabled = true

  // Get the certificate container
  const element = document.querySelector(".certificate-container")

  // Get TC number for filename
  const tcNumber = document.querySelector(".tc-info .field-value")?.textContent || "certificate"

  // Simple PDF options that work reliably
  const opt = {
    margin: [10, 10, 10, 10], // 10mm margins
    filename: `Transfer_Certificate_${tcNumber.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
    image: {
      type: "jpeg",
      quality: 0.98,
    },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    },
  }

  // Add temporary styles for PDF generation
  const tempStyle = document.createElement("style")
  tempStyle.textContent = `
    .button-container { display: none !important; }
    .page-header { display: none !important; }
    .school-name, .certificate-title { 
      color: #d32f2f !important; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .tc-info .field-value, .school-code .field-value { 
      color: #28a745 !important; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  `
  document.head.appendChild(tempStyle)

  // Generate PDF
  // Ensure html2pdf is available globally or imported correctly
  if (window.html2pdf) {
    window
      .html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        // Reset button and cleanup
        downloadBtn.textContent = originalText
        downloadBtn.disabled = false
        document.head.removeChild(tempStyle)
      })
      .catch((error) => {
        console.error("PDF generation failed:", error)
        alert("Failed to generate PDF. Please try again.")
        downloadBtn.textContent = originalText
        downloadBtn.disabled = false
        if (document.head.contains(tempStyle)) {
          document.head.removeChild(tempStyle)
        }
      })
  } else {
    console.error("html2pdf is not a function. Ensure it is properly loaded.")
    alert("PDF generation library not found. Please ensure it is properly loaded.")
    downloadBtn.textContent = originalText
    downloadBtn.disabled = false
    if (document.head.contains(tempStyle)) {
      document.head.removeChild(tempStyle)
    }
  }
}

// Auto-save functionality
function setupAutoSave() {
  setInterval(() => {
    const editableFields = document.querySelectorAll(".editable")
    editableFields.forEach((field, index) => {
      const value = field.textContent.trim()
      if (value && value !== "Click to edit") {
        localStorage.setItem(`certificate_field_${index}`, value)
      }
    })
  }, 30000) // Auto-save every 30 seconds
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  // Initialize certificate manager
  const certificateManager = new CertificateManager()

  // Setup auto-save
  setupAutoSave()

  // Add keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl+P for print
    if (e.ctrlKey && e.key === "p") {
      e.preventDefault()
      printCertificate()
    }

    // Ctrl+S for manual save (already auto-saving)
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault()
      alert("Certificate data is automatically saved!")
    }

    // Ctrl+E for export
    if (e.ctrlKey && e.key === "e") {
      e.preventDefault()
      certificateManager.exportData()
    }

    // Ctrl+D for download PDF
    if (e.ctrlKey && e.key === "d") {
      e.preventDefault()
      downloadPDF()
    }

    // Ctrl+R for clear (with confirmation)
    if (e.ctrlKey && e.key === "r") {
      e.preventDefault()
      certificateManager.clearAllData()
    }
  })

  // Show loading indicator
  document.body.style.opacity = "0"
  setTimeout(() => {
    document.body.style.transition = "opacity 0.5s ease"
    document.body.style.opacity = "1"
  }, 100)
})






// ✅ Supabase credentials
const SUPABASE_URL = 'https://alpvcqrdlwuoeoibrqva.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscHZjcXJkbHd1b2VvaWJycXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MTk1MDEsImV4cCI6MjA2NzA5NTUwMX0.2VBdsRGtvd9xE6PmVpas3CG0bAKTXr0BzgiARGUeTYo'; // full anon key here



// Initialize Supabase from CDN
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Show modal only if user info not already saved
window.onload = function () {
  const hasUserInfo = localStorage.getItem('userName') && localStorage.getItem('userPhone');
  if (!hasUserInfo) {
    document.getElementById('userInfoDialog').style.display = 'flex';
  }
};

// Save user data to Supabase
async function saveUserInfo() {
  const name = document.getElementById('userName').value.trim();
  const phone = document.getElementById('userPhone').value.trim();

  if (!name || !phone) {
    alert("Please enter both your name and phone number.");
    return;
  }

  try {
    const { error } = await supabase.from('userInfo').insert([
      { userName: name, phoneNumber: phone }
    ]);

    if (error) {
      console.error("Supabase Insert Error:", error);
    } else {
      // Save locally so modal won't show again
      localStorage.setItem('userName', name);
      localStorage.setItem('userPhone', phone);
      document.getElementById('userInfoDialog').style.display = 'none';
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}
