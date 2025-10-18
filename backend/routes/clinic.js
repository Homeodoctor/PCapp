const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Clinic = require('../models/Clinic');

// @route   POST api/clinic
// @desc    Create or update clinic info
// @access  Private
router.post('/', auth, async (req, res) => {
    const { clinicName, doctorName, address, phone, logo } = req.body;
    const clinicFields = {
        user: req.user.id,
        clinicName,
        doctorName,
        address,
        phone,
        logo
    };
    try {
        let clinic = await Clinic.findOne({ user: req.user.id });
        if (clinic) {
            // Update
            clinic = await Clinic.findOneAndUpdate({ user: req.user.id }, { $set: clinicFields }, { new: true });
            return res.json(clinic);
        }
        // Create
        clinic = new Clinic(clinicFields);
        await clinic.save();
        res.json(clinic);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/clinic
// @desc    Get current user's clinic info
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const clinic = await Clinic.findOne({ user: req.user.id });
        if (!clinic) {
            return res.status(404).json({ msg: 'Clinic not found' });
        }
        res.json(clinic);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;