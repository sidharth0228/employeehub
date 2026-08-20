const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX'));
  }
});

// GET /api/employees/:empId/documents
router.get('/employees/:empId/documents', authenticateToken, async (req, res) => {
  try {
    const docs = await db.documents.find({ employee_id: req.params.empId }).sort({ uploaded_at: -1 });
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/employees/:empId/documents
router.post('/employees/:empId/documents', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const emp = await db.employees.findOne({ _id: req.params.empId });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const { category_id, expiry_date, notes } = req.body;
    const file_name = req.file ? req.file.originalname : (req.body.file_name || 'uploaded_document');
    const file_url = req.file ? `/uploads/${req.file.filename}` : null;
    const mime_type = req.file ? req.file.mimetype : null;

    // Get category name
    let category_name = req.body.category_name || '';
    if (category_id) {
      const cat = await db.document_categories.findOne({ _id: category_id });
      if (cat) category_name = cat.name;
    }

    const doc = await db.documents.insert({
      employee_id: req.params.empId,
      category_id: category_id || null,
      category_name,
      file_name,
      file_url,
      mime_type,
      expiry_date: expiry_date || null,
      status: 'pending',
      notes: notes || '',
      uploaded_at: new Date().toISOString()
    });

    await db.activity_log.insert({
      actor_id: req.user.id, actor_name: req.user.name,
      action: 'uploaded', entity_type: 'document', entity_id: doc._id,
      details: `Document "${file_name}" uploaded for ${emp.first_name} ${emp.last_name}`,
      created_at: new Date().toISOString()
    });

    res.status(201).json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/documents/:docId/status
router.put('/documents/:docId/status', authenticateToken, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['pending', 'verified', 'rejected', 'expired'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const doc = await db.documents.findOne({ _id: req.params.docId });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    await db.documents.update({ _id: req.params.docId }, {
      $set: { status, notes: notes || doc.notes, verified_by: req.user.id }
    });

    await db.activity_log.insert({
      actor_id: req.user.id, actor_name: req.user.name,
      action: status, entity_type: 'document', entity_id: req.params.docId,
      details: `Document "${doc.file_name}" marked as ${status}`,
      created_at: new Date().toISOString()
    });

    const updated = await db.documents.findOne({ _id: req.params.docId });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/documents/:docId
router.delete('/documents/:docId', authenticateToken, async (req, res) => {
  try {
    await db.documents.remove({ _id: req.params.docId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/document-categories
router.get('/document-categories', authenticateToken, async (req, res) => {
  try {
    const cats = await db.document_categories.find({}).sort({ name: 1 });
    res.json(cats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/document-categories
router.post('/document-categories', authenticateToken, async (req, res) => {
  try {
    const { name, is_required, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    const cat = await db.document_categories.insert({
      name, is_required: !!is_required, description: description || '',
      created_at: new Date().toISOString()
    });
    res.status(201).json(cat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/document-categories/:id
router.put('/document-categories/:id', authenticateToken, async (req, res) => {
  try {
    const { name, is_required, description } = req.body;
    await db.document_categories.update({ _id: req.params.id }, { $set: { name, is_required: !!is_required, description: description || '' } });
    const cat = await db.document_categories.findOne({ _id: req.params.id });
    res.json(cat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/document-categories/:id
router.delete('/document-categories/:id', authenticateToken, async (req, res) => {
  try {
    await db.document_categories.remove({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
