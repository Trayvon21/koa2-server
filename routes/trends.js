/**
 * 个人动态模块
 * @author Trayvon21 <https://github.com/Trayvon21>
 */
const router = require("koa-router")();
router.prefix("/trends");
const Trend = require("../modules/trend");

/**
 * @route get api/trends/addTrends
 * @desc 添加动态
 * @access 接口是私密的
 */
router.post("/allList", async ctx => {
    const { username, reporter, desc, tag } = ctx.request.body;
    if (!username || !reporter || !desc || !tag) {
        ctx.body = {
            code: 500,
            msg: "信息输入不完整"
        };
        return;
    }
    const trend = new Trend({
        username,
        reporter,
        desc,
        tag
    });
    const res = await trend.save();
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
 * @route get api/trends/allTags
 * @desc 获取动态
 * @access 接口是私密的
 */
router.get("/allList", async ctx => {
    const list = await Trend.find();
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
module.exports = router;