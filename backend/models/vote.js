const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["yes", "no"],
    required: true,
  }
});

// Ensure a user can vote only once per date
voteSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);