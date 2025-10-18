const mongoose = require('mongoose');

const ClinicSchema = new mongoose.Schema({
    // Link to the user/doctor
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    clinicName: {
        type: String,
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    logo: {
        // Storing logo as a base64 string
        type: String 
    }
});

module.exports = mongoose.model('clinic', ClinicSchema);