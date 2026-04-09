const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const { requireAuth } = require('../middleware/requireAuth');

const { sendReceiptEmail } = require('../utils/mailer');

// Generate unique order number
function generateOrderNumber() {
  return 'ORD' + Date.now();
}

// Distance helper
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const RESTAURANT_LAT = 25.3908;
const RESTAURANT_LNG = 55.4859;

// Push order data to Google Sheets via Apps Script webhook (fire-and-forget)
function pushToSheets(data) {
  const url = process.env.SHEETS_WEBHOOK_URL;
  if (!url) return; // silently skip if not configured
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(err => console.error('[Sheets] Webhook failed:', err.message));
}

// Place new order
router.post('/', async (req, res, next) => {
  try {
    const { customerName, address, lat, lng, phone, email, items, totalAmount, notes, userId } = req.body;
    
    // Validation
    if (!customerName || !address || !phone || !items || !totalAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Distance validation
    if (lat && lng) {
      const snap = await req.db.ref('settings/deliveryRadiusKm').once('value');
      const maxRadius = snap.exists() ? snap.val() : 20;
      
      const distance = calculateDistance(RESTAURANT_LAT, RESTAURANT_LNG, lat, lng);
      if (distance > maxRadius) {
        return res.status(400).json({ error: `Delivery location is too far (${distance.toFixed(1)}km). Max radius is ${maxRadius}km.` });
      }
    }
    
    const orderNumber = generateOrderNumber();
    
    const newOrder = {
      orderNumber,
      userId: userId || null,
      customerName,
      address,
      lat: lat || null,
      lng: lng || null,
      phone,
      email: email || '',
      items,
      totalAmount,
      notes: notes || '',
      status: 'Pending',
      deliveryFee: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const orderId = req.db.ref('orders').push().key;
    await req.db.ref(`orders/${orderId}`).set(newOrder);
    
    console.log(`✅ Order created: ${orderNumber}`);
    console.log(`📍 Customer: ${customerName}`);
    console.log(`📱 Phone: ${phone}`);
    console.log(`💰 Total: AED ${totalAmount}`);

    // Push to Google Sheets (non-blocking)
    pushToSheets({
      timestamp: new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai', hour12: true }),
      orderNumber,
      customerName,
      phone,
      email: email || '',
      address,
      items: items.map(i => `${i.quantity}× ${i.name}${i.variant ? ` (${i.variant})` : ''}`).join(' | '),
      totalAmount: `AED ${totalAmount}`,
      status: 'Pending',
      notes: notes || '',
    });

    // Fire off async email receipt
    if (email) {
      sendReceiptEmail(newOrder, email);
    }
    
    res.status(201).json({
      success: true,
      orderId: orderNumber,
      message: 'Order placed successfully',
    });
  } catch (error) {
    console.error('❌ Order error:', error);
    next(error);
  }
});

// Get single user's orders
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const snapshot = await req.db.ref('orders').orderByChild('userId').equalTo(uid).once('value');
    const orders = snapshot.val();
    
    if (!orders) {
      return res.json([]);
    }
    
    const ordersArray = Object.values(orders).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    res.json(ordersArray);
  } catch (error) {
    next(error);
  }
});

// Get all orders
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const snapshot = await req.db.ref('orders').once('value');
    const orders = snapshot.val();
    
    if (!orders) {
      return res.json([]);
    }
    
    // Convert object to array and sort by date
    const ordersArray = Object.values(orders).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    res.json(ordersArray);
  } catch (error) {
    next(error);
  }
});

// Get single order
router.get('/:id', requireAdmin, async (req, res, next) => {
  try {
    const snapshot = await req.db.ref('orders').orderByChild('orderNumber').equalTo(req.params.id).once('value');
    const orders = snapshot.val();
    
    if (!orders) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = Object.values(orders)[0];
    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Update order status
router.put('/:orderNumber/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['Pending', 'Preparing', 'On Way', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Find order by orderNumber
    const snapshot = await req.db.ref('orders').once('value');
    const orders = snapshot.val();
    
    if (!orders) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    let orderKey = null;
    for (const key in orders) {
      if (orders[key].orderNumber === req.params.orderNumber) {
        orderKey = key;
        break;
      }
    }
    
    if (!orderKey) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const updates = {
      status,
      updatedAt: new Date().toISOString(),
    };
    
    await req.db.ref(`orders/${orderKey}`).update(updates);
    
    console.log(`🔄 Order ${req.params.orderNumber} updated to: ${status}`);
    
    const updatedOrder = (await req.db.ref(`orders/${orderKey}`).once('value')).val();
    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
});

// Reset all orders (admin only)
router.delete('/reset', requireAdmin, async (req, res, next) => {
  try {
    await req.db.ref('orders').remove();
    console.log('🗑️ All orders wiped by admin');
    res.json({ success: true, message: 'All orders deleted' });
  } catch (error) {
    console.error('❌ Order reset error:', error);
    next(error);
  }
});

module.exports = router;
