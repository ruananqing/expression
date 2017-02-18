/**
 * Created by ruananqing on 2017/2/10.
 */
var formidable = require("formidable");
var db = require("../models/db");
var md5 = require("../models/md5");
var fs = require("fs");
var path = require("path");
var gm = require("gm");


//显示首页
exports.showIndex = function (req, res, next) {
//检索数据库，查找此人的头像
    if (req.session.login == "1") {
        //如果登陆了
        var username = req.session.username;
        var login = true;
    } else {
        //没有登陆
        var username = "";  //制定一个空用户名
        var login = false;
    }
    //已经登陆了，那么就要检索数据库，查登陆这个人的头像
    db.find("users", {username: username}, function (err, result) {
        if (result.length == 0) {
            var avatar = "default.jpg";
        } else {
            var avatar = result[0].avatar;
        }

        res.render("index", {
            "login": login,
            "username" : username,
            "activePage": "index",
            "avatar": avatar  //登陆用户的头像文件名（存放在avatar文件夹中）
        });

    });
};


//进入显示注册页
exports.showRegister = function (req, res, next) {
    res.render("register", {
        "login": req.session.login == "1" ? true : false,
        "username" : req.session.login == "1" ? req.session.username : "",
        "activePage": "register"
    });
};

//注册验证业务
exports.doRegister = function (req, res, next) {

    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        //得到用户填写的东西
        var username = fields.username;
        var password  = fields.password;

        //查询数据库中是不是有这个用户（名）
        db.find("users", {"username": username}, function (err, result) {
            if (err) {
                res.send("-3");//服务器错误
                return;
            }
            if (result.length != 0) {
                res.send("-1");//用户名已被占用注册
                return;
            }
            //现在可以证明，用户名没有被注册占用,则下面开始提交数据写入数据库
            //提交的密码设置md5加密
            password = md5(md5(password) + "ruananqing");

            db.insertOne("users",
                {
                    "username": username,
                    "password": password,
                    "avatar": "default.jpg"
                },
                function (err, result) {
                    if (err) {
                        res.send("-3");//服务器错误
                        return;
                    }
                    //提交数据写入服务器成功，表明注册成功
                    //注册成功后，写入session
                    req.session.login = "1";
                    req.session.username = username;
                    //再前台返回1，
                    // ！！！特别注意！！！res.send()语句的后面不能再写与前台交互的语句
                    //否则无效
                    res.send("1");

                }
            );
        });

    });

};

//进入显示登陆页面
exports.showLogin = function (req, res, next) {
    res.render("login", {
        "login": req.session.login == "1" ? true : false,
        "username" : req.session.login == "1" ? req.session.username : "",
        "activePage": "login"
    });
};

//登陆验证业务
exports.doLogin = function (req, res, next) {

    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        //获取提交的表单后，进行下列操作
        // 得到用户表单
        var username = fields.username;
        var password = fields.password;
        //注意，用户提交的密码需要进行加密，才能跟数据库存储的加密密码做对比
        var encipherPassword = md5(md5(password) + "ruananqing");

        // 查询数据库，验证用户名是存在
        db.find("users", {"username": username}, function (err, result) {
            if (err) {
                res.send("-3");//服务器出错
                return;
            }

            if (result.length == 0) {
                res.send("-1");//没有这个用户名
                return;
            }

            //验证用户名存在，下一步验证密码是否匹配
            if (encipherPassword == result[0].password) {
                req.session.login = "1";//密码验证成功，先写入session
                req.session.username = username;
                res.send("1");//再向前台发送1
                return;
            }
            else {
                res.send("-2");//密码验证失败，密码错误，则向前台发送-2
                return;
            }
        });
    });
};


//显示更改头像（上传）业务页面
exports.showSetAvatar = function (req, res, next) {
    //必须保证登陆再进行相关操作
    if (req.session.login != "1") {
        res.send("非法闯入，请登陆后再进入此页面！");
        return;
    }

    res.render("setAvatar", {
        "login": true,
        "username" : req.session.username,
        "activePage": "setAavatar"
    });
};

//设置头像（上传）业务
exports.doSetAvatar = function (req, res, next) {
    //必须保证登陆再进行相关操作
    if (req.session.login != "1") {
        res.send("非法闯入，请登陆后再进入此页面！");
        return;
    }

    var form = new formidable.IncomingForm();

    form.uploadDir = path.normalize(__dirname + "/../avatar/");
    form.parse(req, function (err, fields, files) {

        var oldpath = files.avatar.path;
        var newpath = path.normalize(__dirname + "/../avatar/" + "/" + req.session.username) + ".jpg";
        fs.rename(oldpath, newpath, function (err) {
            if (err) {
                res.send("上传头像失败");
                return;
            }

            req.session.avatar = req.session.username + ".jpg";
            res.redirect("/picDrop");

        });

    })
};

//进入设置头像（裁剪）业务页面
exports.showPicDrop = function (req, res, next) {
    //必须保证登陆再进行相关操作
    if (req.session.login != "1") {
        res.send("非法闯入，请登陆后再进入此页面！");
        return;
    }

    res.render("picDrop", {
        avatar: req.session.avatar
    });
};

//执行设置头像（裁剪）业务
exports.doDrop = function (req, res) {
    //必须保证登陆再进行相关操作
    if (req.session.login != "1") {
        res.send("非法闯入，请登陆后再进入此页面！");
        return;
    }

    //这个页面接受几个get请求
    var filename = req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;

    gm("./avatar/" + filename)
        .crop(w,h,x,y)
        .resize(100,100,"!")
        .write("./avatar/" + filename,
            function(err){
                if(err){
                    res.send("-1");
                    console.log(err);
                    return;
                }

                //更改数据库当前用户的avatar这个值
                db.updateMany("users", { "username": req.session.username }, {
                        $set : { "avatar" : req.session.avatar }
                    },
                    function (err, results) {
                        res.send("1");
                        return;
                    }
                );

            }
        );
};



//执行发表说说业务
exports.doExpress = function (req, res, next) {
    //此页面需要用户登录，故存在登录session，用户的某些资料可从session得到，不必经表单创造发送
    if (req.session.login != "1") {
        res.send("非法闯入，请登陆后再进入此页面！");
        return;
    }

    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        //得到用户填写的东西
        var content = fields.content;
        var username = req.session.username;

        db.insertOne("expressions",
            {
                "username": username,
                "datetime": new Date(),
                "content": content
            },
            function (err, result) {
                if (err) {
                    res.send("-3");//服务器错误
                    return;
                }
                //提交数据写入服务器成功，表明注册成功
                //注册成功后，写入session
                req.session.login = "1";
                //再前台返回1，
                // ！！！特别注意！！！res.send()语句的后面不能再写与前台交互的语句
                //否则无效
                res.send("1");

            }
        );


    });

};


//显示所有说说业务，有分页功能
exports.getAllExps = function (req, res, next){
    //这个页面接收一个参数，页面
    var page = req.query.page;
    db.find("expressions", {}, {"pageamount":20, "page": page, "sort": {"datetime": -1}},function(err,result){
        res.json(result);
    });
};

//列出某个用户的信息
exports.getUserInfo = function(req,res,next){
    //这个页面接收一个参数，页面
    var username = req.query.username;
    db.find("users",{ "username":username },function(err, result){
        if(err || result.length == 0){
            res.json("");
            return;
        }
        var obj = {
            "username" : result[0].username,
            "avatar" : result[0].avatar,
            "_id" : result[0]._id
        };
        res.json(obj);
    });
};


//列出说说总数
exports.getAllExpsAmount = function (req, res, next) {
    db.getAllCount("expressions", function (count) {
        res.send(count.toString());
    });
};