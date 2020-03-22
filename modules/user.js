/**
 * 用户数据模板
 * @desc 用户名,密码,邮箱,手机号,全球通用头像,创建时间
 * @author Trayvon21 <https://github.com/Trayvon21>
 */
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

let UserSchema = new Schema({
  username: {
    type: String, //类型
    required: true //是否必填
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  avatar: {
    type: String
  },
  createTime: {
    type: Date,
    default: Date.now
  },
  lastLoginTime: {
    type: Date
  },
  __v: {
    type: Number
  },
  photo: {
    type: String,
    default: ""
  },
  gitHubData: {
    type: Object,
    default: {}
  }
});

module.exports = model("User", UserSchema);
