const express = require('express')
const bodyParser = require('body-parser')
const urlencodedParser = bodyParser.urlencoded({extended: false});
const path = require('path')
const mongoose = require('mongoose')
const User = require('./model/user')
const Admin = require('./model/admin')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const passwordValidator = require('password-validator');
const port=process.env.PORT ||3000;
let mongodb=require ('mongodb');
let isAuth = false;
let isAdmin = false;
let schema = new passwordValidator();
schema
    .is().min(8)
    .is().max(100)
    .has().uppercase()
    .has().lowercase()
    .has().not().spaces()
    .has().symbols();

mongoose.connect('mongodb://localhost/restBook_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    family:4
})
let mongoClient = new mongodb.MongoClient('mongodb://localhost/', {
    useUnifiedTopology: true
});
let app= express()
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/rest')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.get('/', function(req, res){
    if(isAdmin){
        res.redirect('/users')
    }
    if(isAuth){
        res.sendFile(path.join(__dirname+'/rest/RestBookAuth.html'))
    }
    else{
        res.sendFile(path.join(__dirname+'/rest/RestBook.html'))
    }
})

app.get('/login', function (req,res){
    if(isAuth){
        res.redirect('/')
    }
    res.sendFile(path.join(__dirname+'/rest/RestBookLogin.html'))
})

app.post('/login', async function (req,res){
    const { username, password } = req.body
    let admin =await Admin.findOne({username}).lean()
    if(admin && password === admin.password){
        isAdmin = true
        isAuth = true
        return res.json({ status: 'ok' })
    }
    const user = await User.findOne({ username }).lean()
    if(!user){
        return res.json({ status: 'error', error: 'Invalid username' })
    }
    if(password !== user.password){
        return res.json({ status: 'error', error: 'Incorrect password' })
    }

    isAuth = true;
    res.json({status:"ok"})
})

app.get('/register', function (req,res){
    if(isAuth){
        res.redirect('/')
    }
    res.sendFile(path.join(__dirname+'/rest/RestBookRegistration.html'))
})

app.post('/register', async function (req,res){
    let username = req.body.username
    let password = req.body.password
    let email = req.body.email
    let city = req.body.city
    let valid = schema.validate(password, {list: true});
    if(valid.length!=0){
        let msg = '';
        if(valid.includes('min')){
            msg = "Password must be longer than 7 characters \n";
        }
        if(valid.includes('lowercase')){
            msg = msg + "Password must contain lowercase letters \n";
        }
        if(valid.includes('uppercase')){
            msg = msg + "Password must must contain uppercase letters \n";
        }
        if(valid.includes('symbols')){
            msg = msg + "Password must contain symbols \n";
        }
        console.log(msg)
        return res.json({
            status: 'error',
            error: msg
        })
    }
    try {
        const response = await User.create({
            username,
            password,
            city,
            email
        })
    } catch (error) {
        if (error.code === 11000) {
            return res.json({ status: 'error', error: 'Username already in use' })
        }
        throw error
    }
    isAuth = true;
    res.json({ status: 'ok'})

});
mongoClient.connect(async function(error, mongo) {
    if (!error) {
        app.get('/users',async function(req, res) {
            if(!isAdmin){
                res.redirect('/')
            }
            let db = mongo.db('restBook_db');
            let coll = db.collection('users');
            let users = await coll.find().sort({username:1}).toArray();
            res.render('users', {users: users});
        });
        app.get('/user/delete/:username', async function(req, res) {
            let db = mongo.db('restBook_db');
            let coll = db.collection('users');
            let name = req.params.username;
            let user = await coll.deleteOne({username: name});
            res.redirect('/users');
        });
        app.get('/user/add', function(req, res) {
            res.render('add');
        });
        app.post('/user/add', async function(req, res) {
            delete req.body._id;
            let db = mongo.db('restBook_db');
            let coll = db.collection('users');
            let user=req.body;
            let result= await coll.insertOne(user);
            res.redirect('/users');

        });
        app.get('/user/edit/:username',async function(req, res) {
            let db = mongo.db('restBook_db');
            let coll = db.collection('users');
            let name= req.params.username;
            let user = await coll.findOne({username: name});
            res.render('edit', {user});
        });
        app.post('/user/edit/:username', async function(req, res) {
            delete req.body._id;
            let db = mongo.db('restBook_db');
            let coll = db.collection('users');
            let user = req.body;
            let resuk= await coll.updateOne({username: user.username}, {$set: user});
            res.redirect('/users');
        });
        let db = mongo.db('restBook_db');
        let coll = db.collection('users');

    } else {
        console.error(error);
    }
});
app.get("/logout", function (req,res){
    isAuth = false
    isAdmin = false
    res.redirect("/")
})
app.listen(port, function() {
    console.log('running');
});
