const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const { body, validationResult, check } = require("express-validator");

const app = express();
const host = "localhost";
const port = 7000;

app.set("view engine", "ejs");

app.use(expressLayouts);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
 
app.use(cookieParser('secret'));
    app.use(session ({
        cookie: {maxAge: 6000},
        secret: 'secret',
        resave: true,
        saveUninitialized: true,
    })
);

app.get("/admin", (req, res) => {
    userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    res.render("admin/index", {
        title: "Welcome To The World",
        userData,
        layout: "admin/templates/core-layout",
    });
});

app.use("/", (res) => {
    res.status(404);
    res.send("<h1>Not Found</h1>");
});
  
  
app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
});