const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
    // Link to the clinic/doctor who created it
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'clinic'
    },
    patient: {
        name: { type: String, required: true },
        age: { type: String, required: true },
        gender: { type: String, required: true },
        contact: { type: String }
    },
    diagnosis: {
        type: String,
        required: true
    },
    medicines: [
        {
            name: { type: String, required: true },
            dosage: { type: String, required: true },
            duration: { type: String, required: true },
            notes: { type: String }
        }
    ],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('prescription', PrescriptionSchema);