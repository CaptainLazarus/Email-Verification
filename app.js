const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const app = express();

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user:'',
        pass:''
    }
});


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mysql'
});


connection.connect();

app.post('/', (req, res) => {

    function Store(pass) {
        
        var verify = Math.floor((Math.random() * 10000000) + 1);



        var mailOption = {
            from :'',
            to : `${req.body.email}`,
            subject: "Account Verification",
            html: `<p>Please verify your account</p><br><hr>
        <br><a href="http://localhost:3000/verification/?verify=${verify}"><p>Click here to verify mail</p></a>`
        }

        // store data 
        var userData = { email: req.body.email, verification: verify , password: pass , username: req.body.username};
        connection.query("INSERT INTO verify SET ?", userData, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                transporter.sendMail(mailOption,(error,info)=>{
                    if(error){
                        console.log(error)
                    }else{
                        console.log(`Inserted into db => ${userData}`);
                        res.send("Mail Sent");
                    }
                })
                console.log('Inserted');
            }
        });
    }

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(req.body.password, salt, function (err, hash) {
            if (err) { 
                console.log(err);
            } else {
                Store(hash);
            }
        });
    });
})


// verification 
app.get('/verification/',(req,res)=>{

    function activateAccount(email , verification , password , username) {
        // console.log("Entered Function");
        
        connection.query("insert into users values (? , ? , ?)" , [email , password , username] , (err,result) => {
            if(err){
                console.log(err);
            }
            else{
                res.send(`<a href="http://localhost:3000/profile/?username=${username}"><p>Go to your profile here</p></a>`);
            }
        });

        connection.query("delete from verify where verification = ?" , verification , (err , result) => {
            if(err){
                console.log(err);
            }
        });
    };

    connection.query("SELECT * FROM verify WHERE verification = ?" , req.query.verify , (err,result) => {
        if(err){
            console.log(err);
        }else{
            activateAccount(result[0]['email'] , result[0]['verification'] , result[0]['password'] , result[0]['username']);
        }
    })
});

app.post('/login',(req,res)=>{
    
    var email = req.body.email;
    var pass = req.body.password;

    function LoginSuccess(username) {
        res.redirect(`/profile/?username=${username}`);
    }

    connection.query('SELECT * FROM users WHERE email = ?',email,(err,result)=>{
        if(err){
            console.log(err);
        }else{
            var hash = result[0].password;
            bcrypt.compare(pass, hash, function(err, res) {
                if(err){
                    res.json({msg:"ERROR"})
                }else{
                    LoginSuccess(result[0].username);
                }
            });
        }
    })
})

app.get('/profile/' , (req , res) => {
    connection.query("SELECT email,username FROM users WHERE username = ?" , req.query.username , (err,result) => {
        if(err){
            console.log(err);
        }else{
            console.log(result);
            res.send(`${result[0].email} , ${result[0].username}`)
        }
    })
});

app.listen(3000);