const AiModelMetadata = require('../models/AiModelMetadata');

// Get all AI model metadata
exports.getAllAiModelMetadata = async (req, res) => {
  try {
    const aiModelMetadata = await AiModelMetadata.find();
    res.json(aiModelMetadata);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get AI model metadata by name and version
exports.getAiModelMetadataByNameVersion = async (req, res) => {
  try {
    const { modelName, modelVersion } = req.params;
    const aiModelMetadata = await AiModelMetadata.findOne({
      model_name: modelName,
      model_version: modelVersion
    });
    if (!aiModelMetadata) {
      return res.status(404).json({ message: 'AI model metadata not found' });
    }
    res.json(aiModelMetadata);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get AI models by type
exports.getAiModelMetadataByType = async (req, res) => {
  try {
    const aiModelMetadata = await AiModelMetadata.find({ model_type: req.params.modelType });
    res.json(aiModelMetadata);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get AI models by status
exports.getAiModelMetadataByStatus = async (req, res) => {
  try {
    const aiModelMetadata = await AiModelMetadata.find({ trang_thai: req.params.status });
    res.json(aiModelMetadata);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new AI model metadata
exports.createAiModelMetadata = async (req, res) => {
  const aiModelMetadata = new AiModelMetadata(req.body);
  try {
    const newAiModelMetadata = await aiModelMetadata.save();
    res.status(201).json(newAiModelMetadata);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update AI model metadata
exports.updateAiModelMetadata = async (req, res) => {
  try {
    const { modelName, modelVersion } = req.params;
    const updatedAiModelMetadata = await AiModelMetadata.findOneAndUpdate(
      { model_name: modelName, model_version: modelVersion },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedAiModelMetadata) {
      return res.status(404).json({ message: 'AI model metadata not found' });
    }
    res.json(updatedAiModelMetadata);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete AI model metadata
exports.deleteAiModelMetadata = async (req, res) => {
  try {
    const { modelName, modelVersion } = req.params;
    const deletedAiModelMetadata = await AiModelMetadata.findOneAndDelete({
      model_name: modelName,
      model_version: modelVersion
    });
    if (!deletedAiModelMetadata) {
      return res.status(404).json({ message: 'AI model metadata not found' });
    }
    res.json({ message: 'AI model metadata deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update model status
exports.updateModelStatus = async (req, res) => {
  try {
    const { modelName, modelVersion } = req.params;
    const { trang_thai } = req.body;

    const updatedAiModelMetadata = await AiModelMetadata.findOneAndUpdate(
      { model_name: modelName, model_version: modelVersion },
      { trang_thai },
      { new: true }
    );

    if (!updatedAiModelMetadata) {
      return res.status(404).json({ message: 'AI model metadata not found' });
    }
    res.json(updatedAiModelMetadata);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update model performance metrics
exports.updateModelPerformance = async (req, res) => {
  try {
    const { modelName, modelVersion } = req.params;
    const { accuracy, f1_score, last_trained } = req.body;

    const updateData = {};
    if (accuracy !== undefined) updateData.accuracy = accuracy;
    if (f1_score !== undefined) updateData.f1_score = f1_score;
    if (last_trained) updateData.last_trained = last_trained;

    const updatedAiModelMetadata = await AiModelMetadata.findOneAndUpdate(
      { model_name: modelName, model_version: modelVersion },
      updateData,
      { new: true }
    );

    if (!updatedAiModelMetadata) {
      return res.status(404).json({ message: 'AI model metadata not found' });
    }
    res.json(updatedAiModelMetadata);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
