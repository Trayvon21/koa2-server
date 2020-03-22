const { secret } = require("./keys");
const crypto = require("crypto");
/**
 * 加密函数
 * @param text  需要加密的内容
 * @param key   秘钥
 * @returns {Query|*}  密文
 */
exports.encode = function(text) {
  var passSecret = secret || "asdhjwheru*asd123&123";
  var cipher = crypto.createCipher("aes-256-cbc", passSecret);
  var crypted = cipher.update(text, "utf8", "hex");
  crypted += cipher.final("hex");
  console.log(crypted);
  return crypted;
};

/**
 * 解密函数
 * @param text  需要解密的内容
 * @param key   秘钥
 * @returns {Query|*}
 */
exports.decode = function(text) {
  var passSecret = secret || "asdhjwheru*asd123&123";
  var decipher = crypto.createDecipher("aes-256-cbc", passSecret);
  var dec = decipher.update(text, "hex", "utf8");
  dec += decipher.final("utf8"); //解密之后的值
  return dec;
};
