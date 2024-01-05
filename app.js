//jshint esversion:6
import dotenv from 'dotenv';
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import encrypt from 'mongoose-encryption';
import md5 from 'md5';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
const port = 3000;
const saltRounds = 8;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/login", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;

    const u = await User.findOne({ email: email }).exec();
    if (u) {
        bcrypt.compare(password, u.password).then((err, result) => {
            if(result) {
                res.render("secrets");
            }
        })
    }
    res.render("login");
});

app.post("/register", (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
    bcrypt.hash(password, saltRounds).then((err, hash) => {
        const newUser = new User({
            email: email,
            password: hash,
        });

        newUser.save();
    });
    res.render("secrets");
});



app.listen(port, () => {
    console.log(`localhost:${port}`);
})