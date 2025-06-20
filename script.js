// Certificate Management System - Complete Version
class CertificateManager {
    constructor() {
        this.editableFields = document.querySelectorAll(".editable")
        this.init()
    }

    init() {
        this.loadSavedData()
        this.attachEventListeners()
        this.setupFieldInteractions()
        this.setupTableNavigation()
        this.updateTimestamp()
    }

    // Update timestamp to current date/time
    updateTimestamp() {
        const now = new Date()
        const timestamp =
            now.toLocaleDateString() + ", " + now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        const timestampElement = document.querySelector(".timestamp")
        if (timestampElement) {
            timestampElement.textContent = timestamp
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

    // Setup field interaction effects
    setupFieldInteractions() {
        this.editableFields.forEach((field) => {
            field.addEventListener("mouseenter", () => {
                if (!field.matches(":focus")) {
                    field.style.transform = "scale(1.01)"
                }
            })

            field.addEventListener("mouseleave", () => {
                if (!field.matches(":focus")) {
                    field.style.transform = "scale(1)"
                }
            })
        })
    }

    // Setup table navigation
    setupTableNavigation() {
        const cells = document.querySelectorAll(".field-cell")
        cells.forEach((cell) => {
            cell.addEventListener("click", (e) => {
                const editableField = cell.querySelector(".editable")
                if (editableField && e.target !== editableField) {
                    editableField.focus()
                }
            })
        })
    }

    // Handle field focus
    onFieldFocus(field) {
        field.classList.add("editing")
        field.style.transform = "scale(1)"

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
        field.classList.remove("editing")
        field.style.transform = "scale(1)"

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

    // Validate certificate data
    validateData() {
        const errors = []

        // Check required fields
        const requiredFields = [
            { selector: ".tc-info .field-value", name: "TC Number" },
            { selector: ".school-code .field-value", name: "School Code" },
        ]

        requiredFields.forEach((field) => {
            const element = document.querySelector(field.selector)
            if (!element || !element.textContent.trim()) {
                errors.push(`${field.name} is required`)
            }
        })

        // Validate editable fields
        this.editableFields.forEach((field, index) => {
            const value = field.textContent.trim()
            const cell = field.closest(".field-cell")
            const fieldNumber = cell?.querySelector(".field-number")?.textContent || `Field ${index + 1}`

            // Validate date fields
            if (fieldNumber.includes("Date") || fieldNumber.includes("ದಿನಾಂಕ")) {
                if (value && !this.isValidDate(value)) {
                    errors.push(`${fieldNumber} has invalid date format`)
                }
            }

            // Validate numeric fields
            if (fieldNumber.includes("No.") || fieldNumber.includes("days") || fieldNumber.includes("ದಿನಗಳ")) {
                if (value && isNaN(value) && !value.includes("/") && !value.includes("-")) {
                    errors.push(`${fieldNumber} should be numeric`)
                }
            }
        })

        return errors
    }

    // Check if date is valid
    isValidDate(dateString) {
        const dateFormats = [
            /^\d{2}[-/]\d{2}[-/]\d{4}$/, // DD/MM/YYYY or DD-MM-YYYY
            /^\d{2}[-/][A-Za-z]{3}[-/]\d{4}$/, // DD-MMM-YYYY
            /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/, // D/M/YYYY
            /^\d{2}-[A-Z]{3}-\d{4}$/, // DD-JAN-YYYY
        ]

        return dateFormats.some((format) => format.test(dateString))
    }

    // Generate certificate ID
    generateCertificateId() {
        const now = new Date()
        const year = now.getFullYear().toString().substr(-2)
        const month = (now.getMonth() + 1).toString().padStart(2, "0")
        const day = now.getDate().toString().padStart(2, "0")
        const random = Math.random().toString(36).substr(2, 6).toUpperCase()

        return `${year}${month}${day}${random}`
    }

    // Auto-fill some fields with sample data
    fillSampleData() {
        const sampleData = {
            0: "", // Admission No
            1: "237831658", // Cumulative Record No
            2: "05-Jun-2023", // Date of Admission
            3: "SANGEETA PRAKASH WALIAKAR", // Student Name
            4: "PRAKASH WALIAKAR", // Father Name
            5: "NIRMALA", // Mother Name
            6: "02-JAN-2017", // Date of Birth
            7: "16-Jun-2025", // Last attendance
            8: "16/06/2025", // Application date
            9: "3", // Class
        }

        Object.keys(sampleData).forEach((index) => {
            if (this.editableFields[index]) {
                this.editableFields[index].textContent = sampleData[index]
                this.saveFieldData(this.editableFields[index], Number.parseInt(index))
            }
        })
    }
}

// Print functionality
function printCertificate() {
    // Validate data before printing
    const manager = new CertificateManager()
    const errors = manager.validateData()

    if (errors.length > 0) {
        const proceed = confirm(
            `Found ${errors.length} validation errors:\n${errors.join("\n")}\n\nDo you want to print anyway?`,
        )
        if (!proceed) return
    }

    // Hide editable indicators before printing
    const editableFields = document.querySelectorAll(".editable")
    editableFields.forEach((field) => {
        field.style.backgroundColor = "transparent"
    })

    window.print()

    // Restore editable indicators after printing
    setTimeout(() => {
        editableFields.forEach((field) => {
            field.style.backgroundColor = "#fff3cd"
        })
    }, 1000)
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

        // Ctrl+R for clear (with confirmation)
        if (e.ctrlKey && e.key === "r") {
            e.preventDefault()
            certificateManager.clearAllData()
        }

        // Ctrl+F for fill sample data
        if (e.ctrlKey && e.key === "f") {
            e.preventDefault()
            certificateManager.fillSampleData()
        }
    })

    // Show loading indicator
    document.body.style.opacity = "0"
    setTimeout(() => {
        document.body.style.transition = "opacity 0.5s ease"
        document.body.style.opacity = "1"
    }, 100)

    // Add context menu for table cells
    document.addEventListener("contextmenu", (e) => {
        if (e.target.closest(".field-cell")) {
            e.preventDefault()
            showTableContextMenu(e, e.target.closest(".field-cell"))
        }
    })
})

// Context menu for table cells
function showTableContextMenu(e, cell) {
    const contextMenu = document.createElement("div")
    contextMenu.className = "context-menu"
    contextMenu.style.cssText = `
        position: fixed;
        top: ${e.clientY}px;
        left: ${e.clientX}px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 5px 0;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        font-size: 12px;
    `

    const editableField = cell.querySelector(".editable")
    const options = [
        { text: "Edit Field", action: () => editableField?.focus() },
        {
            text: "Clear Field",
            action: () => {
                if (editableField) editableField.textContent = ""
            },
        },
        { text: "Copy Text", action: () => navigator.clipboard.writeText(editableField?.textContent || "") },
        { text: "Validate Field", action: () => validateSingleField(editableField) },
        { text: "Fill Sample Data", action: () => new CertificateManager().fillSampleData() },
    ]

    options.forEach((option) => {
        const item = document.createElement("div")
        item.textContent = option.text
        item.style.cssText = "padding: 8px 15px; cursor: pointer; transition: background-color 0.2s;"
        item.addEventListener("mouseenter", () => (item.style.backgroundColor = "#f0f0f0"))
        item.addEventListener("mouseleave", () => (item.style.backgroundColor = "transparent"))
        item.addEventListener("click", () => {
            option.action()
            document.body.removeChild(contextMenu)
        })
        contextMenu.appendChild(item)
    })

    document.body.appendChild(contextMenu)

    // Remove context menu when clicking elsewhere
    setTimeout(() => {
        document.addEventListener("click", function removeMenu() {
            if (document.body.contains(contextMenu)) {
                document.body.removeChild(contextMenu)
            }
            document.removeEventListener("click", removeMenu)
        })
    }, 100)
}

// Validate single field
function validateSingleField(field) {
    if (!field) return

    const value = field.textContent.trim()
    const cell = field.closest(".field-cell")
    const fieldNumber = cell?.querySelector(".field-number")?.textContent || "Field"

    let message = `${fieldNumber}: `

    if (!value || value === "Click to edit") {
        message += "Empty field"
    } else if (fieldNumber.includes("Date") && !isValidDate(value)) {
        message += "Invalid date format"
    } else if (fieldNumber.includes("No.") && isNaN(value)) {
        message += "Should be numeric"
    } else {
        message += "Valid"
    }

    alert(message)
}

// Utility function for date validation
function isValidDate(dateString) {
    const dateFormats = [
        /^\d{2}[-/]\d{2}[-/]\d{4}$/,
        /^\d{2}[-/][A-Za-z]{3}[-/]\d{4}$/,
        /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/,
        /^\d{2}-[A-Z]{3}-\d{4}$/,
    ]

    return dateFormats.some((format) => format.test(dateString))
}
