const mongoose = require('mongoose');

const aiModelMetadataSchema = new mongoose.Schema({
  model_name: {
    type: String,
    required: true
  },
  model_version: {
    type: String,
    required: true
  },
  model_type: {
    type: String,
    required: true,
    enum: [
      "BERT",
      "CNN",
      "Hybrid"
    ]
  },
  use_case: {
    type: String,
    required: true
  },
  training_data_summary: {
    type: String,
    default: null
  },
  accuracy: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  f1_score: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  model_uri: {
    type: String,
    match: /^(ipfs|https):\/\/.*/,
    default: null
  },
  last_trained: {
    type: Date,
    default: null
  },
  trang_thai: {
    type: String,
    required: true,
    enum: [
      "Active",
      "Deprecated",
      "Testing"
    ],
    default: "Active"
  }
}, {
  timestamps: true
});

// Compound index for unique model per name and version
aiModelMetadataSchema.index({ model_name: 1, model_version: 1 }, { unique: true });

module.exports = mongoose.model('AiModelMetadata', aiModelMetadataSchema, 'ai_model_metadata');
