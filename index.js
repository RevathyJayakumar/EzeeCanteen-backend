const express=require("express");
const app=express();
const mysql=require("mysql2");
const bodyParser=require('body-parser');
const cors=require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { STATUS_CODES } = require('http');
var config = require('./config.env');

const db = mysql.createConnection(
    config.databaseOptions
);

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/accounts", (req, res) => {
    db.query("SELECT * FROM account_details ", (err, result) => {
        console.log(result);
        res.send(result);
    });
})

app.get('/lastid', (req, res) => {
    db.query("SELECT MAX(id) FROM signup ", (err, result) => {
        console.log(result);
        res.send(result);
    });
})

app.post('/carddetails', (req, res) => {
    const cardName = req.body.cname;
    const cardNo = req.body.cNo;
    const expiryDate = req.body.expiry;
    const cvcNumber = req.body.Nocvc;
    const UId = req.body.uid;
    db.query("INSERT INTO account_details (name,cardNumber,expiry,cvc,userId) VALUES (?,?,?,?,?)", [cardName, cardNo, expiryDate, cvcNumber, UId], (err, result) => {
        console.log("card details send");
    });
})

app.post('/login', (req, res) => {
    var email = req.body.email;
    const password = req.body.password;
    const guess = password;
    db.query('SELECT password FROM signup WHERE email = ? ', [email], function (err, hash, req) {
        var resultArrayh = Object.values(JSON.parse(JSON.stringify(hash)))
        bcrypt.compare(guess, resultArrayh[0].password, function (err, resh) {
            console.log(resh, hash, password, resultArrayh)
            console.log(resultArrayh[0].password)
            if (email && password) {
                db.query('SELECT * FROM signup WHERE email = ? AND password = ? ', [email, resultArrayh[0].password], function (err, results, req) {
                    console.log(results)
                    if (results.length > 0 && resh) {
                        db.query('SELECT usertype,fullname from signup WHERE email = ? and password=? ', [email, resultArrayh[0].password], (err, ust) => {
                            var resultArray = Object.values(JSON.parse(JSON.stringify(ust)))
                            res.status(200).json({
                                status: 'success',
                                data: resultArray
                            })
                        });
                    }
                    else {
                        res.send({ message: 'Incorrect Email and/or Password!' });
                        res.end();
                    }
                });
            }
            else {
                res.send({ message: 'Please enter Email id and Password!' });
                res.end();
            }
        })
    });
});

app.post("/loginuser", (requ, resu) => {
    const email = requ.body.email;
    db.query("select fullname, email from signup where email=?", [email], (err, resu1) => {
        resu.send(resu1)
    })
})


app.post("/api/insert", (req1, res1) => {
    const fullname = req1.body.fullname;
    const email = req1.body.email;
    const password = req1.body.password;
    const usertype = req1.body.usertype;
    bcrypt.hash(password, 10, function (err, hash) {
        //if (err) throw err
        console.log(fullname, email, hash);
        if (fullname == "" || email == "" || password == "" || usertype == "") {
            res1.send({ message: "Enter Fullname, Email id and Password and select Usertype to Sign up !!!" })
        }
        else{
        db.query("SELECT email from signup where email=?", [email], (err, res11) => {
            if (err) throw err;
            if (res11.length == 0) {

                db.query("INSERT INTO signup (usertype,fullname,email,password) VALUES (?,?,?,?)", [usertype, fullname, email, hash], function () {
                })
            }
            else if (res11.length > 0) {
                res1.send({ message: "Email id already exists!!!" })
            }

            res1.end();
            return;
        })
    }
    })
});


app.post("/api/forgot", (req1, res1) => {
    const email = req1.body.email;
    const password = req1.body.password;
    console.log(email, password);
    bcrypt.hash(password, 10, function (err, hash) {
        console.log(hash)
        if (email == "" || password == "") {
            res1.send({ message: "Enter  Email id and Password to Reset Password !!!" })
        }
        db.query("SELECT email from signup where email=?", [email], (err, res11,) => {
            console.log(res11)  
            if (res11.length == 0) {
                res1.send({ message: "Email id does not exists!!!" })
            }
            else if (res11.length > 0) {
                db.query("UPDATE signup SET password=? WHERE email=?", [hash, email])
            }
        })
        res1.end();
    })
});

app.get("/api/get1", (req, res) => {
    const email = req.query.email;
    console.log(email);
    db.query("SELECT fullname FROM signup where email=?", [email], (err, result) => {
        if (result.length > 0) {
            const fullName = result[0].fullname
            res.send(fullName);
        }
    })
});

app.get("/api/get/breakfast", (req,res) =>{
    const sqlSelect="SELECT * FROM breakfast_ss;";
    db.query(sqlSelect, (err,result) =>{
        console.log(result);
        res.send(result);
    });    
});

app.get("/api/get/lunch", (req, res) => {
    const sqlSelect = "SELECT * FROM lunch;";
    db.query(sqlSelect, (err, result) => {
        console.log(result);
        res.send(result);
    });
});

app.get("/api/get/snacks", (req, res) => {
    const sqlSelect = "SELECT * FROM menu.snacks;";
    db.query(sqlSelect, (err, result) => {
        console.log(result);
        res.send(result);
    });
});

app.get("/api/fetch", (req,res) =>{
    const sqlSelect="SELECT * FROM orders;";
   db.query(sqlSelect, (err,result) =>{
        console.log(result);
        res.send(result);
    });   
});

app.post("/api/fetch1", (req, res) => {
    const ord = req.body.orderno
    const sqlSelect = "SELECT * FROM orders where orderNo=? and orderStatus='Completed'";
    db.query(sqlSelect, [ord], (err, result) => {
        if (result.length > 0) {
            res.send({ message: "completed" })
        }
        else {
            res.send()
        }
    })

});

app.get("/id", (req, res) => {
    const email = req.body.email
    console.log("Email")
    console.log(email)
    db.query("SELECT * FROM signup ", (err, result) => {
        console.log(result);
        res.send(result);
    });
})

app.post("/placeorder", (req, res) => {
    const iname = req.body.name;
    const quantity = req.body.qty;
    const date = req.body.OrderDate;
    const time = req.body.Ordertime;
    const uname = req.body.uname;
    const order = req.body.ordno;
    const tt = req.body.timet;
    db.query("INSERT INTO menu.orders (itemName,itemQty,orderTime,orderDate,username,orderNo,timetest) VALUES (?,?,?,?,?,?,?)", [iname, quantity, time, date, uname, order, tt], (err, result) => {
        console.log("send to db");
    });
});

app.get("/count", (req, res) => {
    const sqlSelect = "SELECT orderNo FROM orders WHERE id=(SELECT MAX(id) FROM orders);";
    db.query(sqlSelect, (err, result) => {
        console.log(result);
        res.send(result);
    });
});

app.post("/orderstatus", (req, res) => {
    const orderStatus = req.body.Ostatus;
    const orderid = req.body.Oid;
    const ordNo = req.body.oNo;
    db.query("UPDATE orders SET orderStatus=(?) WHERE id=(?) and orderNo=(?)", [orderStatus, orderid, ordNo], (err, result) => {
        console.log("send to db");
    });

});

app.get("/api/get", (req, res) => {
    const sqlSelect = "SELECT * FROM breakfast_ss;";
    db.query(sqlSelect, (err, result) => {
        res.send(result);
    });

});

app.listen(3001,() =>{
    console.log('running on port 3001');
});