// The backend server URL
const API_URL = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html') {
        // Main page logic
        if (!token) {
            window.location.href = 'clinic-setup.html';
            return;
        }
        initializeMainPage();
    } else if (currentPage === 'clinic-setup.html') {
        // Setup/Login page logic
        if (token) {
            // If user is logged in, check if clinic is set up
            checkClinicSetupAndRedirect();
        }
        initializeSetupPage();
    }
});

// =================================================================
// LOGIN / SETUP PAGE LOGIC (clinic-setup.html)
// =================================================================
function initializeSetupPage() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const clinicSetupForm = document.getElementById('clinic-setup-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    if (clinicSetupForm) {
        clinicSetupForm.addEventListener('submit', handleClinicSetup);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Login failed');

        localStorage.setItem('token', data.token);
        showAlert('Login successful!', 'success');
        await checkClinicSetupAndRedirect();

    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Registration failed');
        
        localStorage.setItem('token', data.token);
        showAlert('Registration successful! Please set up your clinic.', 'success');
        document.getElementById('pills-tabContent').style.display = 'none';
        document.getElementById('clinic-setup-section').style.display = 'block';

    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function handleClinicSetup(e) {
    e.preventDefault();
    const clinicName = document.getElementById('clinic-name').value;
    const doctorName = document.getElementById('doctor-name').value;
    const address = document.getElementById('clinic-address').value;
    const phone = document.getElementById('clinic-phone').value;
    const logoFile = document.getElementById('clinic-logo').files[0];

    let logoBase64 = null;
    if (logoFile) {
        logoBase64 = await toBase64(logoFile);
    }

    const clinicData = { clinicName, doctorName, address, phone, logo: logoBase64 };

    try {
        const response = await fetch(`${API_URL}/api/clinic`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token'),
            },
            body: JSON.stringify(clinicData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Clinic setup failed');

        localStorage.setItem('clinicDetails', JSON.stringify(data));
        showAlert('Clinic information saved successfully!', 'success');
        window.location.href = 'index.html';

    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function checkClinicSetupAndRedirect() {
    try {
        const response = await fetch(`${API_URL}/api/clinic`, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });

        if (response.status === 404) {
            // Clinic not found, show setup form
            showAlert('Please set up your clinic information.', 'info');
            document.getElementById('pills-tabContent').style.display = 'none';
            document.getElementById('clinic-setup-section').style.display = 'block';
        } else if (response.ok) {
            const clinicDetails = await response.json();
            localStorage.setItem('clinicDetails', JSON.stringify(clinicDetails));
            window.location.href = 'index.html';
        } else {
             localStorage.removeItem('token'); // Invalid token
        }
    } catch (error) {
        showAlert('Could not connect to server.', 'danger');
    }
}


// =================================================================
// MAIN PAGE LOGIC (index.html)
// =================================================================
function initializeMainPage() {
    // Event Listeners
    document.getElementById('add-medicine-btn').addEventListener('click', addMedicineRow);
    document.getElementById('save-prescription-btn').addEventListener('click', savePrescription);
    document.getElementById('print-pdf-btn').addEventListener('click', generatePDF);
    document.getElementById('search-btn').addEventListener('click', searchPatients);
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('patient-info-form').addEventListener('input', updatePrescriptionPreview);
    document.getElementById('diagnosis').addEventListener('input', updatePrescriptionPreview);
    
    // Initial setup
    loadClinicDetails();
    addMedicineRow(); // Add the first medicine row
    loadPrescriptionHistory();
    updateDate();
}

function loadClinicDetails() {
    const clinicDetails = JSON.parse(localStorage.getItem('clinicDetails'));
    if (!clinicDetails) {
        // If details are missing, fetch them again.
        checkClinicSetupAndRedirect();
        return;
    }

    // Populate header
    const header = document.getElementById('prescription-header');
    header.innerHTML = `
        ${clinicDetails.logo ? `<img src="${clinicDetails.logo}" alt="Clinic Logo" style="max-width: 100px; max-height: 100px; margin-bottom: 1rem;">` : ''}
        <h2>${clinicDetails.clinicName}</h2>
        <p>${clinicDetails.address}</p>
        <p>Phone: ${clinicDetails.phone}</p>
    `;

    // Populate footer
    const footer = document.getElementById('prescription-footer');
    footer.innerHTML = `
        <p><strong>Dr. ${clinicDetails.doctorName}</strong></p>
    `;
}

function updateDate() {
    const date = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
    document.getElementById('current-date-display').textContent = date;
}

function addMedicineRow() {
    const list = document.getElementById('medicines-list');
    const rowId = `med-row-${list.children.length}`;
    const newRow = document.createElement('div');
    newRow.className = 'row g-3 align-items-center mb-3 medicine-row';
    newRow.id = rowId;
    newRow.innerHTML = `
        <div class="col-md-3"><input type="text" class="form-control" placeholder="Medicine Name" required></div>
        <div class="col-md-3"><input type="text" class="form-control" placeholder="Dosage (e.g., 1-0-1)" required></div>
        <div class="col-md-2"><input type="text" class="form-control" placeholder="Duration" required></div>
        <div class="col-md-3"><input type="text" class="form-control" placeholder="Notes (Optional)"></div>
        <div class="col-md-1"><button type="button" class="btn btn-sm btn-danger" onclick="removeMedicineRow('${rowId}')">X</button></div>
    `;
    list.appendChild(newRow);
    // Add event listener to new row for live preview update
    newRow.addEventListener('input', updatePrescriptionPreview);
}

// This function needs to be global to be called from the button's onclick
window.removeMedicineRow = function(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
        updatePrescriptionPreview();
    }
}

function updatePrescriptionPreview() {
    // Patient Info
    document.getElementById('patient-name-display').textContent = document.getElementById('patient-name').value;
    document.getElementById('patient-age-display').textContent = document.getElementById('patient-age').value;
    document.getElementById('patient-gender-display').textContent = document.getElementById('patient-gender').value;
    document.getElementById('patient-contact-display').textContent = document.getElementById('patient-contact').value;

    // Diagnosis
    document.getElementById('diagnosis-display').textContent = document.getElementById('diagnosis').value;

    // Medicines
    const medicinesDisplay = document.getElementById('medicines-list-display');
    medicinesDisplay.innerHTML = '';
    const medicineRows = document.querySelectorAll('.medicine-row');
    medicineRows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const name = inputs[0].value;
        const dosage = inputs[1].value;
        const duration = inputs[2].value;
        const notes = inputs[3].value;

        if (name) { // Only add if medicine name is present
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${name}</strong><br><small>${notes || ''}</small></td>
                <td>${dosage}</td>
                <td>${duration}</td>
            `;
            medicinesDisplay.appendChild(tr);
        }
    });
}

async function savePrescription() {
    const patient = {
        name: document.getElementById('patient-name').value,
        age: document.getElementById('patient-age').value,
        gender: document.getElementById('patient-gender').value,
        contact: document.getElementById('patient-contact').value
    };

    const diagnosis = document.getElementById('diagnosis').value;

    if (!patient.name || !patient.age || !patient.gender || !diagnosis) {
        showAlert('Please fill all required fields: Patient Info and Diagnosis.', 'warning');
        return;
    }

    const medicines = [];
    const medicineRows = document.querySelectorAll('.medicine-row');
    medicineRows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const medicine = {
            name: inputs[0].value,
            dosage: inputs[1].value,
            duration: inputs[2].value,
            notes: inputs[3].value
        };
        if (medicine.name && medicine.dosage && medicine.duration) {
            medicines.push(medicine);
        }
    });

    if (medicines.length === 0) {
        showAlert('Please add at least one medicine.', 'warning');
        return;
    }

    const prescriptionData = { patient, diagnosis, medicines };

    try {
        const response = await fetch(`${API_URL}/api/prescriptions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify(prescriptionData)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.msg || 'Failed to save prescription.');
        }

        showAlert('Prescription saved successfully!', 'success');
        loadPrescriptionHistory(); // Refresh the history
        // Optionally, reset the form
        document.getElementById('patient-info-form').reset();
        document.getElementById('diagnosis').value = '';
        document.getElementById('medicines-list').innerHTML = '';
        addMedicineRow();
        updatePrescriptionPreview();

    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function loadPrescriptionHistory(query = '') {
    const historyContainer = document.getElementById('prescription-history');
    historyContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    let url = `${API_URL}/api/prescriptions`;
    if (query) {
        url = `${API_URL}/api/prescriptions/search?q=${encodeURIComponent(query)}`;
    }

    try {
        const response = await fetch(url, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });

        if (!response.ok) throw new Error('Could not fetch history.');

        const prescriptions = await response.json();
        historyContainer.innerHTML = ''; // Clear spinner

        if (prescriptions.length === 0) {
            historyContainer.innerHTML = '<p class="text-center text-muted">No prescriptions found.</p>';
            return;
        }

        prescriptions.forEach(p => {
            const item = document.createElement('a');
            item.className = 'list-group-item list-group-item-action flex-column align-items-start';
            item.href = '#';
            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${p.patient.name}</h5>
                    <small>${new Date(p.date).toLocaleDateString()}</small>
                </div>
                <p class="mb-1">Diagnosis: ${p.diagnosis}</p>
                <small>Age: ${p.patient.age}, Gender: ${p.patient.gender}</small>
            `;
            item.addEventListener('click', (e) => {
                e.preventDefault();
                viewPrescription(p);
            });
            historyContainer.appendChild(item);
        });
    } catch (error) {
        historyContainer.innerHTML = `<p class="text-center text-danger">${error.message}</p>`;
    }
}

function searchPatients() {
    const query = document.getElementById('search-patient').value;
    loadPrescriptionHistory(query);
}

function viewPrescription(prescription) {
    // Populate the form fields with the selected prescription data
    document.getElementById('patient-name').value = prescription.patient.name;
    document.getElementById('patient-age').value = prescription.patient.age;
    document.getElementById('patient-gender').value = prescription.patient.gender;
    document.getElementById('patient-contact').value = prescription.patient.contact || '';
    document.getElementById('diagnosis').value = prescription.diagnosis;

    const medicinesList = document.getElementById('medicines-list');
    medicinesList.innerHTML = '';
    prescription.medicines.forEach(med => {
        const rowId = `med-row-${medicinesList.children.length}`;
        const newRow = document.createElement('div');
        newRow.className = 'row g-3 align-items-center mb-3 medicine-row';
        newRow.id = rowId;
        newRow.innerHTML = `
            <div class="col-md-3"><input type="text" class="form-control" value="${med.name}" required></div>
            <div class="col-md-3"><input type="text" class="form-control" value="${med.dosage}" required></div>
            <div class="col-md-2"><input type="text" class="form-control" value="${med.duration}" required></div>
            <div class="col-md-3"><input type="text" class="form-control" value="${med.notes || ''}"></div>
            <div class="col-md-1"><button type="button" class="btn btn-sm btn-danger" onclick="removeMedicineRow('${rowId}')">X</button></div>
        `;
        medicinesList.appendChild(newRow);
    });

    // Update the live preview
    updatePrescriptionPreview();
    updateDate(); // Show current date even for old prescriptions
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const prescriptionElement = document.getElementById('prescription-to-print');
    
    // Use html2canvas to capture the element as an image
    html2canvas(prescriptionElement, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        
        // Calculate dimensions for PDF
        const pdf = new jsPDF('p', 'mm', 'a5'); // A5 size is common for prescriptions
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasRatio = canvasHeight / canvasWidth;
        const imgHeight = pdfWidth * canvasRatio;
        
        let height = Math.min(imgHeight, pdfHeight);

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, height);
        
        const patientName = document.getElementById('patient-name').value;
        pdf.save(`Prescription-${patientName || 'Patient'}-${new Date().toISOString().slice(0,10)}.pdf`);
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('clinicDetails');
    showAlert('You have been logged out.', 'info');
    window.location.href = 'clinic-setup.html';
}


// =================================================================
// UTILITY FUNCTIONS
// =================================================================

// Convert file to base64
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Show dynamic alert
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.classList.remove('show');
        alert.addEventListener('transitionend', () => alert.remove());
    }, 5000);
}