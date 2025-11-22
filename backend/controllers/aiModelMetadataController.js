const AiModelMetadata = require('../models/AiModelMetadata');
const fs = require('fs').promises;
const path = require('path');

// Get all AI model metadata
exports.getAllAiModelMetadata = async (req, res) => {
  try {
    const models = await AiModelMetadata.find().sort({ createdAt: -1 });
    res.json({
      message: 'AI model metadata retrieved successfully',
      data: models
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get AI model metadata by name and version
exports.getAiModelMetadataByNameVersion = async (req, res) => {
  try {
    const { ten_mo_hinh, phien_ban } = req.query;
    if (!ten_mo_hinh || !phien_ban) {
      return res.status(400).json({ message: 'ten_mo_hinh and phien_ban are required' });
    }
    const model = await AiModelMetadata.findOne({ ten_mo_hinh, phien_ban });
    if (!model) {
      return res.status(404).json({ message: 'AI model metadata not found' });
    }
    res.json(model);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new AI model metadata
exports.createAiModelMetadata = async (req, res) => {
  try {
    const model = new AiModelMetadata(req.body);
    const newModel = await model.save();
    res.status(201).json(newModel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update AI model metadata
exports.updateAiModelMetadata = async (req, res) => {
  try {
    const updatedModel = await AiModelMetadata.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedModel) {
      return res.status(404).json({ message: 'AI model metadata not found' });
    }
    res.json(updatedModel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete AI model metadata
exports.deleteAiModelMetadata = async (req, res) => {
  try {
    const deletedModel = await AiModelMetadata.findByIdAndDelete(req.params.id);
    if (!deletedModel) {
      return res.status(404).json({ message: 'AI model metadata not found' });
    }
    res.json({ message: 'AI model metadata deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get CNN metadata from file
exports.getCnnMetadata = async (req, res) => {
  try {
    const cnnMetaPath = path.join(__dirname, '../../dataset/test.ai_model_metadata.cnn.csv.meta.json');
    const data = await fs.readFile(cnnMetaPath, 'utf-8');
    const metadata = JSON.parse(data);
    res.json(metadata);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'CNN metadata file not found. Please run reduce_dim_cnn.py first.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get PCA metadata from file
exports.getPcaMetadata = async (req, res) => {
  try {
    const pcaMetaPath = path.join(__dirname, '../../dataset/test.ai_model_metadata.pca.csv.meta.json');
    const data = await fs.readFile(pcaMetaPath, 'utf-8');
    const metadata = JSON.parse(data);
    res.json(metadata);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'PCA metadata file not found. Please run reduce_dim.py first.' });
    }
    res.status(500).json({ message: error.message });
  }
};
