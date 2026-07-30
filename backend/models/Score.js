const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  game:  { type: String, enum: ['snake', 'tetris'], required: true },
  score: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Score', scoreSchema);