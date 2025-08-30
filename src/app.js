import express from "express";
import process from "process";
import session from "express-session";
import passport from "passport";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(session({ secret: process.env.SECRET_SESSION, resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("/");
});

app.listen(PORT);
