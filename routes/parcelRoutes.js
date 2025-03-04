const express = require('express');
const Parcel = require('../models/Parcel');
const router = express.Router();

// Add a new parcel
router.post('/add', async (req, res) => {
  console.log("Received data:", req.body);
  try {
    const parcel = new Parcel(req.body);
    const savedParcel = await parcel.save();
    console.log(savedParcel);
    res.status(201).json(savedParcel);
  } catch (error) {
    res.status(500).json({ message: 'Error saving parcel', error });
  }
});

// Get all parcels
router.get('/', async (req, res) => {
    try {
      const parcels = await Parcel.find();
      res.status(200).json(parcels);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching parcels', error });
    }
  });
  
  // Get a parcel by parcelId
  router.get('/:parcelId', async (req, res) => {
    try {
      const parcel = await Parcel.findOne({ parcelId: req.params.parcelId });
      if (!parcel) {
        return res.status(404).json({ message: 'Parcel not found' });
      }
      res.status(200).json({
        success: true,
        existingPosts: parcel
      })
    } catch (error) {
      res.status(500).json({ message: 'Error fetching parcel', error });
    }
  });

  // Update a parcel by parcelId
router.put('/update/:parcelId', async (req, res) => {
    try {
      const parcel = await Parcel.findOne({ parcelId: req.params.parcelId });
      if (!parcel) {
        return res.status(404).json({ message: 'Parcel not found' });
      }
  
      // Update parcel with provided data
      Object.assign(parcel, req.body);
  
      const updatedParcel = await parcel.save();
      res.status(200).json(updatedParcel);
    } catch (error) {
      res.status(500).json({ message: 'Error updating parcel', error });
    }
  });
  // Delete a parcel by parcelId
/*router.delete('/delete/:parcelId', async (req, res) => {
    try {
      const parcel = await Parcel.findOne({ parcelId: req.params.parcelId });
      if (!parcel) {
        return res.status(404).json({ message: 'Parcel not found' });
      }
  
      await parcel.remove();
      res.status(200).json({ message: 'Parcel deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting parcel', error });
    }
  });*/
  
  router.delete('/delete/:parcelId', async (req, res) => {
    try {
      const parcelId = req.params.parcelId;
      console.log('Received parcelId for deletion:', parcelId);
  
      // Attempt deletion
      const result = await Parcel.deleteOne({ parcelId });
      console.log('Deletion result:', result);
  
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Parcel not found' });
      }
  
      res.status(200).json({ message: 'Parcel deleted successfully' });
    } catch (error) {
      console.error('Error during deletion:', error);
      res.status(500).json({ message: 'Error deleting parcel', error: error.message });
    }
  });
  

module.exports = router;
