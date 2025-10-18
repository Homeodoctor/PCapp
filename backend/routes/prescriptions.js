const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Prescription = require('../models/Prescription');
const Clinic = require('../models/Clinic');

// @route   POST api/prescriptions
// @desc    Create a new prescription
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const clinic = await Clinic.findOne({ user: req.user.id });
        if (!clinic) {
            return res.status(400).json({ msg: 'Clinic not set up for this user' });
        }
        const { patient, diagnosis, medicines } = req.body;
        const newPrescription = new Prescription({
            clinic: clinic._id,
            patient,
            diagnosis,
            medicines,
        });
        const prescription = await newPrescription.save();
        res.json(prescription);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/prescriptions
// @desc    Get all prescriptions for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const clinic = await Clinic.findOne({ user: req.user.id });
        if (!clinic) {
            return res.status(404).json({ msg: 'Clinic not found' });
        }
        // Find prescriptions linked to the user's clinic and sort by newest first
        const prescriptions = await Prescription.find({ clinic: clinic._id }).sort({ date: -1 });
        res.json(prescriptions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/prescriptions/search
// @desc    Search prescriptions by patient name
// @access  Private
router.get('/search', auth, async (req, res) => {
    try {
        const clinic = await Clinic.findOne({ user: req.user.id });
        if (!clinic) {
            return res.status(404).json({ msg: 'Clinic not found' });
        }
        const prescriptions = await Prescription.find({
            clinic: clinic._id,
            'patient.name': { $regex: req.query.q, $options: 'i' } // case-insensitive search
        }).sort({ date: -1 });
        res.json(prescriptions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;