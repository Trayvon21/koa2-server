/**
 * 主文件
 * @author Trayvon21 <https://github.com/Trayvon21>
 */
const Koa = require("koa");
const app = new Koa();
const views = require("koa-views");
const json = require("koa-json");
const onerror = require("koa-onerror");
const logger = require("koa-logger");
const mongoose = require("mongoose"); //引入MongoDB支持
const { mongoUrl, whitePath, secret } = require("./config/keys"); //引入秘钥

const session = require("koa-session"); // 引入koa-session
const jwt = require("koa-jwt"); //引入token验证
const decodeToken = require("./config/decodeToken.js");

//引入路由
const index = require("./routes/index");
const users = require("./routes/users");
const plan = require("./routes/plan");
const trends = require("./routes/trends");

const koaBody = require("koa-body");

// error handler
onerror(app);

app.use(json());
app.use(logger());
app.use(require("koa-static")(__dirname + "/public"));

//配置koa-session
app.keys = ["hellow w"];
const config = {
    key: "koa:sess", //cookie key (default is koa:sess)
    maxAge: 86400000, // cookie的过期时间 maxAge in ms (default is 1 days)
    overwrite: true, //是否可以overwrite    (默认default true)
    httpOnly: true, //cookie是否只有服务器端可以访问 httpOnly or not (default true)
    signed: true, //签名默认true
    rolling: false, //在每次请求时强行设置cookie，这将重置cookie过期时间（默认：false）
    renew: false //(boolean) renew session when session is nearly expired,
};
app.use(session(config, app));

app.use(
    views(__dirname + "/views", {
        extension: "pug"
    })
);

app.use(
    koaBody({
        multipart: true,
        formidable: {
            maxFileSize: 200 * 1024 * 1024
        }
    })
);
//token验证
// jwt
app.use(async(ctx, next) => {
    let token = ctx.headers.authorization;
    console.log(token);
    if (token === undefined) {
        await next();
    } else {
        decodeToken.decodeToken(token).then(data => {
            //这一步是为了把解析出来的用户信息存入全局state中，这样在其他任一中间价都可以获取到state中的值
            // console.log("数据:" + JSON.stringify(data));
            ctx.state = {
                data: data
            };
        });
        await next();
    }
});

// token设置
app.use(async(ctx, next) => {
    return next().catch(err => {
        if (err.status === 401) {
            ctx.status = 401;
            ctx.body = {
                status: 401,
                msg: "登录过期，请重新登录"
            };
        } else {
            throw err;
        }
    });
});

app.use(
    jwt({ secret }).unless({
        path: whitePath //数组中的路径不需要通过jwt验证
    })
);

// logger
app.use(async(ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// routes
app.use(index.routes(), index.allowedMethods());
app.use(users.routes(), users.allowedMethods());
app.use(plan.routes(), plan.allowedMethods());
app.use(trends.routes(), trends.allowedMethods());

app.use(async(ctx, next) => {
    ctx.set("Access-Control-Allow-Origin", "*");
    ctx.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild"
    );
    ctx.set("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
    const start = new Date();
    if (ctx.method == "OPTIONS") {
        ctx.body = 200;
    } else {
        await next();
    }
    const ms = new Date() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});
// error-handling
app.on("error", (err, ctx) => {
    console.error("server error", err, ctx);
});

//链接MongoDB
mongoose
    .connect(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("Mongodb登录成功");
    })
    .catch(err => {
        console.log("Mongodb登录失败", err);
    });

module.exports = app;