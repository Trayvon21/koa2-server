//加载koa-multer模块
const multer = require("koa-multer");

//配置
let storage = multer.diskStorage({
  //文件保存路径
  destination: function(req, file, cb) {
    cb(null, "public/uploads/");
  },
  //修改文件名称
  filename: function(req, file, cb) {
    let fileFormat = file.originalname.split(".");
    cb(null, Date.now() + "." + fileFormat[fileFormat.length - 1]);
  }
});
//加载配置
module.exports = upload = multer({ storage: storage });
