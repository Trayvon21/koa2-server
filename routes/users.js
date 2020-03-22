/**
 * 用户模块
 * @author Trayvon21 <https://github.com/Trayvon21>
 */
const gravatar = require("gravatar");
const router = require("koa-router")();
const User = require("../modules/user");
router.prefix("/users");
const smsClient = require("../config/sms");
const svgCaptcha = require("svg-captcha");
const jsonwebtoken = require("jsonwebtoken");
const { secret, gitConfig } = require("../config/keys");
const { encode, decode } = require("../config/tools");
const { sendMail } = require("../config/sendEmail");
const fetch = require("node-fetch");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
/**
 * @route POST api/users/register
 * @desc 用户注册
 * @access 接口是公开的
 */
router.post("/register", async ctx => {
    const { username, password, phone, email, phoneCode } = ctx.request.body;
    if (!username || !password || !phone || !email || !phoneCode) {
        ctx.body = {
            code: 500,
            msg: "信息输入不完整"
        };
        return;
    }
    const avatar = gravatar.url(ctx.request.body.email, {
        s: "200",
        r: "pg",
        d: "mm"
    });
    const userCheck = await User.findOne({ username });
    const phoneCheck = await User.findOne({ phone });
    const emailCheck = await User.findOne({ email });
    if (userCheck) {
        ctx.body = {
            code: 500,
            msg: "用户名已存在"
        };
        return;
    }
    if (phoneCheck) {
        ctx.body = {
            code: 500,
            msg: "手机号已存在"
        };
        return;
    }
    if (emailCheck) {
        ctx.body = {
            code: 500,
            msg: "邮箱已存在"
        };
        return;
    }
    if (!ctx.session.phoneCheck || !ctx.session.phoneCheck[`${phone}-register`]) {
        ctx.body = {
            code: 500,
            msg: "未获取验证码"
        };
        return;
    }
    const { createTime, codeCheck } = ctx.session.phoneCheck[`${phone}-register`];
    const dateShort = new Date() - createTime;
    if (String(phoneCode) != String(codeCheck)) {
        ctx.body = {
            code: 500,
            msg: "验证码错误"
        };
    } else if (dateShort > 5 * 60 * 1000) {
        ctx.body = {
            code: 500,
            msg: "验证码已失效"
        };
    } else {
        const md5Pass = await encode(password);
        const newUser = new User({
            username,
            password: md5Pass,
            phone,
            email,
            avatar
        });
        const res = await newUser.save();
        if (res) {
            ctx.body = {
                code: 200,
                msg: "注册成功",
                data: {
                    username,
                    phone,
                    password,
                    email,
                    avatar,
                    createTime: newUser.createTime
                }
            };
        } else {
            ctx.body = {
                code: 500,
                msg: "注册失败"
            };
        }
    }
});

/**
 * @route GET api/users/verify
 * @desc 获取验证码
 * @access 接口是公开的
 * session中存放verify
 */
router.get("/verify", async ctx => {
    //创建captcha
    const captcha = svgCaptcha.create();
    //session中保存captcha.text(全转为小写)
    ctx.session.verify = captcha.text.toLowerCase();
    console.log(captcha.text.toLowerCase());
    //输出
    ctx.body = {
        code: 200,
        captcha: captcha
    };
});

/**
 * @route POST api/users/login
 * @desc 用户登录(包含手机号登录与用户名登录)
 * @access 接口是公开的
 * 在session中存放user
 */
router.post("/login", async ctx => {
    const { username, password, verify, phone, phoneCode } = ctx.request.body;
    let userCheck = {};
    if (phone) {
        userCheck = await User.findOne({ phone });
        if (!ctx.session.phoneCheck[`${phone}-login`]) {
            ctx.body = {
                code: 500,
                msg: "未发送验证码"
            };
            return;
        }
        const { codeCheck, createTime } = ctx.session.phoneCheck[`${phone}-login`];
        const dateShort = new Date().getTime() - createTime;
        if (phoneCode !== codeCheck) {
            ctx.body = {
                code: 500,
                msg: "验证码错误"
            };
            return;
        } else if (dateShort > 1000 * 60 * 5) {
            ctx.body = {
                code: 500,
                msg: "验证码已过期"
            };
            return;
        }
    } else {
        if (!username | !password | !verify) {
            ctx.body = {
                code: 500,
                msg: "信息输入不完整"
            };
            return;
        }
        userCheck = await User.findOne({ username });
        if (!userCheck) {
            ctx.body = {
                code: 500,
                msg: "账号不存在"
            };
            return;
        }
        if (verify.toLowerCase() !== ctx.session.verify) {
            ctx.body = {
                code: 500,
                msg: "验证码错误"
            };
            return;
        }
        const md5Pass = await encode(password);
        if (md5Pass !== userCheck.password) {
            ctx.body = {
                code: 500,
                msg: "密码错误"
            };
            return;
        }
    }
    console.log(userCheck);
    sendMail(userCheck.email, null, state => {
        resolve(state);
    });
    const lastLoginTime = new Date();
    let res = await User.findByIdAndUpdate(userCheck.id, {
        lastLoginTime
    });
    const user = {
        username: userCheck.username,
        email: userCheck.email,
        phone: userCheck.phone,
        avatar: userCheck.avatar,
        photo: userCheck.photo
    };
    ctx.session.user = user;
    if (res) {
        ctx.body = {
            code: 200,
            msg: "登录成功",
            user: user,
            token: jsonwebtoken.sign({ username, email: userCheck.email, id: userCheck.id },
                secret, {
                    expiresIn: "2h"
                }
            ),
            lastLoginTime: lastLoginTime
        };
    } else {
        ctx.body = {
            code: 500,
            msg: "登录失败"
        };
    }
});

/**
 * @route get api/users/githubLogin
 * @desc github登录
 * @access 接口是公开的
 * 跳转路由到github网站
 */
router.get("/githubLogin", async ctx => {
    var dataStr = new Date().valueOf();
    //重定向到认证接口,并配置参数
    var path = "https://github.com/login/oauth/authorize";
    path += "?client_id=" + gitConfig.clientId;
    path += "&scope=" + gitConfig.scope;
    path += "&state=" + dataStr;
    //转发到授权服务器
    ctx.redirect(path);
});

/**
 * @route get api/users/githubCallback
 * @desc github登录回调
 * @access 接口是公开的
 * 获取github的token并保存用户资料，生成新token
 */
router.post("/githubCallback", async ctx => {
    const { code } = ctx.request.body;
    console.log(code);
    let path = "https://github.com/login/oauth/access_token";
    const params = {
        client_id: gitConfig.clientId,
        client_secret: gitConfig.scope,
        code: code
    };
    await fetch(path, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(params)
        })
        .then(res => {
            return res.text();
        })
        .then(body => {
            const args = body.split("&");
            let arg = args[0].split("=");
            const access_token = arg[1];
            console.log(body);
            console.log(access_token);
            return access_token;
        })
        .then(async token => {
            const url = " https://api.github.com/user?access_token=" + token;

            await fetch(url)
                .then(res => {
                    return res.json();
                })
                .then(async res => {
                    const userData = await User.findOne({ email: res.email })
                    if (userData) {
                        userInfo = await User.findByIdAndUpdate(userData.id, {
                            avatar: userData.avatar_url,
                            gitHubData: userData
                        })

                    } else {
                        const userFind = await User.findOne({ username: res.login })
                        if (userFind) {
                            userFind.login = userFind.login + parseInt(random() * 1000);
                            msg = "用户名重复，默认添加随机字符";
                        }
                        let user = new User({
                            username: res.login,
                            password: "github登录",
                            phone: "",
                            email: res.email,
                            avatar: res.avatar_url,
                            gitHubData: res
                        })
                        userInfo = await user.save()

                    }
                    if (!userInfo) {
                        ctx.body = {
                            code: 500,
                            msg: "登录失败"
                        };
                        return
                    }
                    ctx.body = {
                        code: 200,
                        msg: "登录成功",
                        user: {
                            username: userInfo.username,
                            email: userInfo.email,
                            phone: userInfo.phone,
                            avatar: userInfo.avatar,
                            photo: userInfo.photo
                        },
                        token: jsonwebtoken.sign({ username: userInfo.username, email: userInfo.email, id: userInfo.id },
                            secret, {
                                expiresIn: "2h"
                            })
                    }
                });

        })
        .catch(e => {
            console.log(e);
            ctx.body = e;
        });
});
/**
 * @route POST api/users/sendCode
 * @desc 短信发送
 * @accept phone 电话号码 ; type 类型  login/register
 * @access 接口是公开的
 */
router.post("/sendCode", async ctx => {
    const { phone, type } = ctx.request.body;
    //查看类型是否传入正确
    if (!(type === "login" || type === "register")) {
        ctx.body = {
            code: 500,
            msg: "类型错误"
        };
        return;
    }
    if (!ctx.session.phoneCheck) {
        ctx.session.phoneCheck = {};
    }
    const phoneCheck = await User.findOne({ phone });
    if (type === "register" && phoneCheck) {
        ctx.body = {
            code: 500,
            msg: "本号码已被注册"
        };
        return;
    }
    if (type === "login" && !phoneCheck) {
        ctx.body = {
            code: 500,
            msg: "本号码未注册"
        };
        return;
    }
    //随机生成数字
    let codeCheck = String(parseInt(Math.random() * 1000000));
    //小于6位的自动补全
    codeCheck = (Array(6).join("0") + codeCheck).slice(-6);
    ctx.session.phoneCheck[`${phone}-${type}`] = {
        codeCheck,
        createTime: new Date().getTime()
    };
    ctx.body = ctx.session.phoneCheck;
    // 发送短信;
    // await smsClient
    //   .sendSMS({
    //     PhoneNumbers: phone, //必填:待发送手机号。
    //     SignName: "长江在线", //必填:短信签名
    //     TemplateCode: type === "register" ? "SMS_179280360" : "SMS_186596114", //必填:短信模板
    //     TemplateParam: `{"code":"${codeCheck}"}` //可选:模板中的变量替换JSON串${code}
    //   })
    //   .then(
    //     function(res) {
    //       let { Code } = res;
    //       if (Code === "OK") {
    //         ctx.body = {
    //           code: 200,
    //           msg: "短信发送成功"
    //         };
    //       }
    //     },
    //     function(err) {
    //       ctx.body = {
    //         code: 500,
    //         msg: "短信发送失败",
    //         err: err
    //       };
    //     }
    //   );
});

/**
 * @route GET api/users/getUserList
 * @desc 获取用户列表
 * @access 接口是私密的
 */
router.get("/getUserList", async ctx => {
    const userList = await User.find();
    const arr = [];
    userList.map(item =>
        arr.push({
            username: item.username,
            email: item.email,
            phone: item.phone,
            avatar: item.avatar,
            photo: item.photo,
            createTime: item.createTime
        })
    );
    ctx.body = {
        code: 200,
        captcha: arr
    };
});

/**
 * @route GET api/users/getUser
 * @desc 获取用户列表
 * @access 接口是私密的
 */
router.get("/getUser", async ctx => {
    const userData = await User.findById(ctx.state.data.id);
    ctx.body = {
        code: 200,
        userData: {
            username: userData.username,
            email: userData.email,
            phone: userData.phone,
            avatar: userData.avatar,
            photo: userData.photo,
            createTime: userData.createTime
        }
    };
});

/**
 * @route GET api/users/updatePasswd
 * @desc 修改密码
 * @access 接口是私密的
 */
router.post("/updatePasswd", async ctx => {
    const { password } = ctx.request.body;
    const userInfo = await User.findById(ctx.state.data.id);
    var md5Pass = await encode(password);
    if (md5Pass === userInfo.password) {
        ctx.body = {
            code: 500,
            msg: "新密码不能跟旧密码相同"
        };
    } else {
        let res = await User.findOneAndUpdate(id, { password: md5Pass });
        if (res) {
            ctx.body = {
                code: 200,
                msg: "修改成功"
            };
        } else {
            ctx.body = {
                code: 200,
                msg: "修改失败"
            };
        }
    }
});

/**
 * @route POST api/users/findPasswd
 * @desc 找回密码
 * @access 接口是私密的
 */
router.post("/findPasswd", async ctx => {
    const { username, email } = ctx.request.body;
    const userInfo = await User.findOne({ email });
    console.log(11, userInfo);
    if (!userInfo) {
        ctx.body = {
            code: 500,
            msg: "该邮箱不存在"
        };
        return;
    }
    if (username === userInfo.username) {
        console.log(userInfo);
        const md5Pass = await decode(userInfo.password);
        const code = { username: userInfo.username, password: md5Pass };
        sendMail(userInfo.email, code, state => {
            resolve(state);
        });
        ctx.body = {
            code: 200,
            msg: "已发送至您邮箱，请查收"
        };
    } else {
        ctx.body = {
            code: 500,
            msg: "请输入正确的用户名"
        };
    }
});

/**
 * @route POST api/users/updatePhoto
 * @desc 头像更新
 * @access 接口是私密的
 */
router.post("/updatePhoto", async ctx => {
    const { id } = ctx.state.data;
    const file = ctx.request.files.file;
    // 接收读出流
    const reader = fs.createReadStream(file.path);
    // 创建写入流
    const ext = file.name.split(".").pop(); // 获取上传文件扩展名
    if (ext !== "png" || "gif" || "jpg" || "jpeg") {
        ctx.body = {
            code: 500,
            msg: "图片格式错误"
        };
    } else {
        const name = dayjs(new Date()).format("YYYYMMDDHHmmss"); //创建文件名
        const stream = fs.createWriteStream(
            path.join("public/uploads", `pic${name}.${ext}`)
        );
        // 用管道将读出流 "倒给" 输入流
        reader.pipe(stream);
        let res = await User.findByIdAndUpdate(id, {
            photo: `public/uploads/pic${name}.${ext}`
        });
        if (res) {
            ctx.body = {
                code: 200,
                msg: "上传成功",
                path: `public/uploads/pic${name}.${ext}`
            };
        } else {
            ctx.body = {
                code: 500,
                msg: "上传失败"
            };
        }
    }
});

/**
 * @route GET api/users/exit
 * @desc 退出接口
 * @access 接口是私密的
 */
router.get("/exit", async ctx => {
    ctx.session = null;
    ctx.cookie = null;
    ctx.state.data = null;
    ctx.body = {
        code: 200,
        msg: "退出成功"
    };
});
module.exports = router;