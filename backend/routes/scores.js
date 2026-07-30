const express = require('express');
const Score = require('../models/Score');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { game, score } = req.body;
    if (!['snake', 'tetris'].includes(game)) {
      return res.status(400).json({ message: 'Invalid game' });
    }
    const existing = await Score.findOne({ user: req.userId, game });
    if (!existing) {
      await Score.create({ user: req.userId, game, score });
    } else if (score > existing.score) {
      existing.score = score;
      await existing.save();
    }
    res.json({ message: 'Score saved' });
  } catch (err) {
    console.log('==== SCORES SAVE ERROR ====');
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/mine', auth, async (req, res) => {
  try {
    const scores = await Score.find({ user: req.userId });
    const result = {};
    scores.forEach(s => { result[s.game] = s.score; });
    res.json(result);
  } catch (err) {
    console.log('==== SCORES MINE ERROR ====');
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

//module.exports = router;
//router.get('/all', async (req, res) => {
//  const scores = await Score.find({});
//  res.json(scores);
//});
//router.get('/debug/:userId', async (req, res) => {
//  const scores = await Score.find({ user: req.params.userId });
//  res.json({ lookedFor: req.params.userId, found: scores });
//});