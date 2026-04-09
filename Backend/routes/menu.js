const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const snapshot = await req.db.ref('menu_items').once('value');
    const items = snapshot.val();
    
    if (!items) {
      return res.json([]);
    }
    
    // Convert object to array
    const itemsArray = Object.values(items);
    res.json(itemsArray);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get menu items by category
router.get('/category/:category', async (req, res) => {
  try {
    const snapshot = await req.db.ref('menu_items').once('value');
    const items = snapshot.val();
    
    if (!items) {
      return res.json([]);
    }
    
    const filtered = Object.values(items).filter(item => item.category === req.params.category);
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const snapshot = await req.db.ref(`menu_items/${req.params.id}`).once('value');
    const item = snapshot.val();
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new menu item (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, image, variants } = req.body;
    
    const itemId = req.db.ref('menu_items').push().key;
    const newItem = {
      id: itemId,
      name,
      description,
      price,
      category,
      image: image || null,
      available: true,
      createdAt: new Date().toISOString(),
    };

    // Only include variants if they were provided
    if (variants && Array.isArray(variants) && variants.length > 0) {
      newItem.variants = variants;
    }
    
    await req.db.ref(`menu_items/${itemId}`).set(newItem);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update menu item (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const snapshot = await req.db.ref(`menu_items/${req.params.id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Only update fields that are provided
    const updates = {};
    const allowed = ['name', 'description', 'price', 'category', 'image', 'available', 'variants'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    updates.updatedAt = new Date().toISOString();

    await req.db.ref(`menu_items/${req.params.id}`).update(updates);
    const updated = await req.db.ref(`menu_items/${req.params.id}`).once('value');
    res.json(updated.val());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset entire menu (admin only) — must be before /:id
router.delete('/reset', requireAdmin, async (req, res) => {
  try {
    await req.db.ref('menu_items').remove();
    console.log('🗑️ Entire menu wiped by admin');
    res.json({ success: true, message: 'Menu reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete single menu item (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const snapshot = await req.db.ref(`menu_items/${req.params.id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Item not found' });
    }
    await req.db.ref(`menu_items/${req.params.id}`).remove();
    console.log(`🗑️ Menu item ${req.params.id} deleted`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
