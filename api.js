import axios from "axios";
export default {
  /**
   * 用户模块
   */
  register, //注册 post { username, password, phone, email, phoneCode }
  sendCode, //手机验证码 post { phone,type }
  login, //登录 post { username, password, verify} | { phone, phoneCode }
  getVerify, //获取验证码 get
  githubLogin, //github登录 get
  githubCallback, //github返回用户数据 post { code }
  getUserList, //获取用户列表 get
  getUser, //获取用户信息 get
  updatePasswd, //修改密码 post { password }
  findPasswd, //找回密码 post { username, email }
  updatePhoto, //更新照片 post { file }
  exit, //退出登录 get

  /**
   * 日程管理模块
   */
  addPlan, //添加日程 post { start, finish, players, desc }
  getPlanList, //获取日程列表 get
  delPlan, //删除日程 post {id}
  repLastWeek, //重复上周 post {id}

  /**
   * 个人动态模块
   */
  addTrends, //添加动态 post { username, reporter, desc, tag }
  getAllList //获取所有动态分类
};

function register({ username, password, phone, email, phoneCode }) {
  return axios.post("/users/register", {
    username,
    password,
    phone,
    email,
    phoneCode
  });
}

function sendCode({ phone, type }) {
  return axios.post("/users/sendCode", { phone, type });
}

function login({ username, password, verify, phone, phoneCode }) {
  return axios.post("/user/login", {
    username,
    password,
    verify,
    phone,
    phoneCode
  });
}

function getVerify() {
  return axios.get("/user/verity");
}

function githubLogin() {
  return axios.get("/user/githubLogin");
}

function githubCallback() {
  return axios.post("/user/githubCallback");
}

function getUserList() {
  return axios.get("/user/getUserList");
}

function getUser() {
  return axios.get("/user/getUser");
}

function updatePasswd(password) {
  return axios.post("/user/updatePasswd", { password });
}

function findPasswd(username, email) {
  return axios.post("/user/findPasswd", { username, email });
}

function updatePhoto() {
  return axios.post("/user/updatePhoto");
}

function exit() {
  return axios.get("/user/exit");
}

function addPlan(start, finish, players, desc) {
  return axios.post("/plan/addPlan", { start, finish, players, desc });
}

function getPlanList() {
  return axios.get("/plan/getPlanList");
}

function delPlan(id) {
  return axios.post("/plan/delPlan", id);
}

function repLastWeek(id) {
  return axios.post("/plan/repLastWeek", id);
}

function addTrends(username, reporter, desc, tag) {
  return axios.post("/trends/addTrends", { username, reporter, desc, tag });
}

function getAllList() {
  return axios.get("/trends/allList");
}
