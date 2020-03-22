/**
 * 个人动态模板
 * @desc
 * @author Trayvon21 <https://github.com/Trayvon21>
 */
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

let UserSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  creatTime: {
    type: Date,
    default: Date.now
  },
  reporter: {
    type: String,
    default: ""
  },
  desc: {
    type: String,
    default: ""
  },
  tag: {
    type: String,
    default: ""
  }
});

module.exports = model("Trend", UserSchema);
