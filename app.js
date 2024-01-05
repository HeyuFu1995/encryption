//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import passport from 'passport';
import passportLocalMongoose from "passport-local-mongoose";
import session from "express-session";
import dotenv from 'dotenv';
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import findOrCreate from 'mongoose-findorcreate';

dotenv.config();


const app = express();
const port = 3000;
const saltRounds = 8;

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.set('trust proxy', 1); // trust first proxy
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
},
    (accessToken, refreshToken, profile, cb) => {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/auth/google", (req, res) => {
    passport.authenticate("google", { scope: ["profile"] })(req, res, () => {
        res.redirect("/secrets");
    });
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/login", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;

    const user = new User({
        username: email,
        password: password,
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);
            res.redirect("/login");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    })
});

app.post("/register", (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
    User.register({ username: email }, password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/submit", (req, res) => {
    const submittedSecret = req.body.secret;
    User.findById(req.user.id).then(async (err, foundUser) => {
        if(err) {
            console.log(err);
        } else {
            foundUser.secret = submittedSecret;
            await foundUser.save();
            res.redirect("/secrets");
            
        }
    });
});

app.get("/secrets", (req, res) => {
    
    if (req.isAuthenticated()) {
        User.find({"secret": {$ne: null}}).then((err, foundUsers) => {
            if(err) {
                console.log(err);
            } else {
                if(foundUsers) {
                   return res.render("secrets", {usersWithSecret: foundUsers});
                }
            }
        });
    } 
    res.redirect("/login");
    
});

app.get("/logout", (req, res) => {
    req.logout((err) => {
        console.log(err);
    });
    res.redirect("/");
});



app.listen(port, () => {
    console.log(`localhost:${port}`);
})