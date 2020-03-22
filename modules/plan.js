/**
 * 日程安排模板
 * @desc
 * @author Trayvon21 <https://github.com/Trayvon21>
 */
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

let UserSchema = new Schema({
  start: {
    type: Date,
    required: true
  },
  finish: {
    type: Date,
    required: true
  },
  players: {
    type: Array,
    default: []
  },
  desc: {
    type: String
  }
});

module.exports = model("Plan", UserSchema);
