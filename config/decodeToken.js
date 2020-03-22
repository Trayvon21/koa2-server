const jwt = require("jsonwebtoken");
const { secret } = require("./keys.js");
exports.decodeToken = function(token) {
  return new Promise((resolve, reject) => {
    let userInfo = jwt.decode(token.split(" ")[1], secret);
    resolve(userInfo);
    console.log("userInfo", userInfo);
  }).catch(err => {
    console.log(err);
  });
};
