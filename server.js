const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const app = express();

// Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: true
}));

// MongoDB connect
mongoose.connect("mongodb+srv://suraj2:suraj211@cluster0.tdwd7ll.mongodb.net/skillswap")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

//  Schema (ONLY ONCE)
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true }, //  IMPORTANT
    password: String,
    skill: String,
    wantSkill: String
});

const User = mongoose.model("User", userSchema);

// Home
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views/index.html"));
});

// Register Page
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "views/register.html"));
});

// Register POST
app.post("/register", async (req, res) => {
    try {

        const existingUser = await User.findOne({ email: req.body.email });

        if(existingUser){
            return res.send("User already exists ❌");
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new User({
            name: req.body.name,
            email: req.body.email.toLowerCase(),
            password: hashedPassword,
            skill: req.body.skill,
            wantSkill: req.body.wantSkill
        });

        await newUser.save();

        res.send("User Registered Successfully ✅");

    } catch (err) {   //  ab sahi hai
        console.log(err);
        res.send("Error saving user ");
    }
});

// Login Page
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views/login.html"));
});

// Login POST
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.send("User Not Found ");
        }

        const isMatch = await bcrypt.compare(password, user.password);

     if (isMatch) {
            req.session.user = user;   //  session set
            res.redirect("/dashboard");
        } else {
            res.send("Wrong Password ");
        }

    } catch (err) {
        console.log(err);
        res.send("Login Error ");
    }
});

app.get("/dashboard", (req, res) => {
    if (!req.session.user) {
        return res.send("Please login first ");
    }

    res.sendFile(path.join(__dirname, "views/dashboard.html"));
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.send("Logged out !");
    });
});

app.get("/me", (req, res) => {
    if (!req.session.user) {
        return res.json(null);
    }
    res.json(req.session.user);
});

app.get("/users", async (req, res) => {
    try {
        const users = await User.find(); //ALL USERS
        res.json(users);
    } catch (err) {
        console.log(err);
        res.send("Error fetching users");
    }
});
//request route
app.post("/send-request", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.send("Login required ");
        }

        const newRequest = new Request({
            fromUser: req.session.user.email,  // real user
            toUser: req.body.toUser,
            skillOffered: req.body.skillOffered,
            skillWanted: req.body.skillWanted
        });

        await newRequest.save();
        res.send("Request Sent ");

    } catch (err) {
        console.log(err);
        res.send("Error sending request ");
    }
});
const requestSchema = new mongoose.Schema({
    fromUser: String,
    toUser: String,
    skillOffered: String,
    skillWanted: String,
    status: {
        type: String,
        default: "pending"
    }
});

const Request = mongoose.model("Request", requestSchema);

app.get("/my-requests", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.send("Login required");
        }

        const requests = await Request.find({
            toUser: req.session.user.email
        });

        res.json(requests);

    } catch (err) {
        console.log(err);
        res.send("Error fetching requests ");
    }
});

app.get("/requests-page", (req, res) => {
    res.sendFile(path.join(__dirname, "views/requests.html"));
});

app.post("/update-request", async (req, res) => {
    try {
        const { id, status } = req.body;

        await Request.findByIdAndUpdate(id, { status });

        res.send("Updated ");
    } catch (err) {
        console.log(err);
        res.send("Error updating ");
    }
});

app.get("/my-sent-requests", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.send("Login required ");
        }

        const requests = await Request.find({
            fromUser: req.session.user.email
        });

        res.json(requests);
    } catch (err) {
        console.log(err);
        res.send("Error ");
    }
});

// Server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});