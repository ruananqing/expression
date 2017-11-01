/**
 * Created by ruananqing on 2017/2/10.
 */
var express = require("express");
var app = express();
var router = require("./router/router");
var session = require("express-session");



//模板引擎
app.set("view engine", "ejs");

//静态页面
app.use(express.static("./public"));
app.use("/avatar", express.static("./avatar"));

//设置session中间件
app.use(session({
    secret: "keyboard cat",
    resave: false,
    saveUnintialized: true
}));






//路由表
app.get("/", router.showIndex);

//进入注册页面
app.get("/register", router.showRegister);
//注册验证业务
app.post("/doRegister", router.doRegister);


//进入登陆页面
app.get("/login", router.showLogin);
//登陆验证业务
app.post("/doLogin", router.doLogin);


//进入设置头像(上传)页面
app.get("/setAvatar", router.showSetAvatar);
//设置头像业务
app.post("/doSetAvatar", router.doSetAvatar);


//进入设置头像（裁剪）页面
app.get("/picDrop", router.showPicDrop);
//执行设置头像（裁剪）页面
app.get("/doDrop", router.doDrop);

//执行发表说说业务
app.post("/doExpress", router.doExpress);

//用Ajax服务显示所有说说业务
app.get("/getAllExps", router.getAllExps);


//列出某个用户的信息
app.get("/getUserInfo", router.getUserInfo);


//列出说说总数
app.get("/getAllExpsAmount", router.getAllExpsAmount);

//列出某个用户的所有的说说
app.get("/user/:user", router.showUserExps);

//列出所有用户的所有的说说
app.get("/allUsersList", router.showAllUsersList);

//显示当前系统参数
app.get("/condition", router.showCondition);
/*
app.get("/", router.);
app.get("/", router.);
*/




app.listen(80);