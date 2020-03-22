/**
 * 日程管理模块
 * @author Trayvon21 <https://github.com/Trayvon21>
 */
const dayjs = require("dayjs");
const router = require("koa-router")();
router.prefix("/plan");
const Plan = require("../modules/plan");

/**
 * @route get api/plan/addPlan
 * @desc 添加日程
 * @access 接口是私密的
 */
router.post("/addPlan", async ctx => {
  const { start, finish, players, desc } = ctx.request.body;
  if (!start || !finish || !players || !desc) {
    ctx.body = {
      code: 500,
      msg: "信息输入不完整"
    };
    return;
  }
  if (finish < start) {
    ctx.body = {
      code: 500,
      msg: "时间输入错误"
    };
    return;
  }
  const newPlan = new Plan({
    start,
    finish,
    players,
    desc
  });
  const res = await newPlan.save();
  if (res) {
    ctx.body = {
      code: 200,
      msg: "添加成功",
      newPlan
    };
  } else {
    ctx.body = {
      code: 500,
      msg: "添加失败"
    };
  }
});

/**
 * @route get api/plan/getPlanList
 * @desc 获取日程
 * @access 接口是私密的
 */
router.get("/getPlanList", async ctx => {
  const { username } = ctx.state.data;
  const list = await Plan.find();
  if (list) {
    ctx.body = {
      code: 200,
      msg: "获取成功",
      list
    };
  } else {
    ctx.body = {
      code: 500,
      msg: "没有列表或者获取失败"
    };
  }
});

/**
 * @route get api/plan/delPlan
 * @desc 删除日程
 * @access 接口是私密的
 */
router.post("/delPlan", async ctx => {
  const { username } = ctx.state.data;
  const { id } = ctx.request.body;
  const res = await Plan.findByIdAndRemove(id);
  if (res) {
    ctx.body = {
      code: 200,
      msg: "删除成功"
    };
  } else {
    ctx.body = {
      code: 500,
      msg: "删除失败"
    };
  }
});

/**
 * @route get api/plan/repLastWeek
 * @desc 重复上周
 * @access 接口是私密的
 */
router.post("/repLastWeek", async ctx => {
  const { username } = ctx.state.data;
  const { id } = ctx.request.body;
  const lastWeek = await Plan.findById(id);
  let short = 1000 * 60 * 60 * 24 * 7;
  const newPlan = new Plan({
    start: new Date(lastWeek.start).getTime() + short,
    finish: new Date(lastWeek.finish).getTime() + short,
    players: lastWeek.players,
    desc: lastWeek.desc
  });
  console.log(new Date(lastWeek.start).getTime() + short);
  const res = await newPlan.save();
  if (res) {
    ctx.body = {
      code: 200,
      msg: "添加成功",
      res
    };
  } else {
    ctx.body = {
      code: 500,
      msg: "添加失败"
    };
  }
});

module.exports = router;
