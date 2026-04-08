const express = require('express');
const router = express.Router();

// Get all pending/preparing orders for kitchen display
router.get('/orders', async (req, res) => {
  try {
    const snapshot = await req.db.ref('orders').once('value');
    const orders = snapshot.val();
    
    if (!orders) {
      return res.json([]);
    }
    
    // Filter pending and preparing, sort by date
    const filtered = Object.values(orders)
      .filter(order => ['Pending', 'Preparing'].includes(order.status))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders (for kitchen to see everything)
router.get('/all', async (req, res) => {
  try {
    const snapshot = await req.db.ref('orders').once('value');
    const orders = snapshot.val();
    
    if (!orders) {
      return res.json([]);
    }
    
    // Convert to array and sort by date
    const ordersArray = Object.values(orders).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    res.json(ordersArray);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders by status
router.get('/status/:status', async (req, res) => {
  try {
    const snapshot = await req.db.ref('orders').once('value');
    const orders = snapshot.val();
    
    if (!orders) {
      return res.json([]);
    }
    
    const filtered = Object.values(orders)
      .filter(order => order.status === req.params.status)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
