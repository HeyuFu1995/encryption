//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
import ejs from 'ejs';
import mongoose from "mongoose";
import encrypt from 'mongoose-encryption';

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secret = "Thisisalongsecret.";
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

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
    if(u && u.password === password) {
        return res.render("secrets");
    }
    res.render("login");
});

app.post("/register", (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
    const newUser = new User({
        email: email,
        password: password,
    });

    newUser.save();

    res.render("secrets");
});



app.listen(port, () => {
    console.log(`localhost:${port}`);
})