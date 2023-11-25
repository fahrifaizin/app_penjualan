const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require("bcrypt")
const flash = require('connect-flash');
const { body, validationResult, check } = require("express-validator");
const { getAllAdmin } = require("./models/userModel.js");

const app = express();
const host = "localhost";
const port = 7000;

app.set("view engine", "ejs");
app.enable("strict routing")

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

async function passwordHash (password) {
    const result = await bcrypt.hash(password, 10)
    return result
}

async function passwordVerification (password, passwordHash) {
    const result = await bcrypt.compare(password, passwordHash)
    return result
}

// tampilan dashboard admin
app.get("/admin", async (req, res) => {
    userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    const password = await passwordHash('admin')
    const passwordVerify = await passwordVerification('admin', '$2b$10$FgD/UV0j30Loiwwy3c87fu/xe7B0GamnUIDHyLPmDiRT6TRqzibWO')
    res.render("admin/dashboard", {
        title: "App Penjualan - Dashboard",
        userData,
        layout: "admin/templates/core-layout",
        baseUrl: false
    });
});

// tampilan data admin
app.get("/admin/users", async (req, res) => {
    const userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    const dataAdmin = await getAllAdmin()
    res.render("admin/data-admin", {
        title: "App Penjualan - Data Admin",
        userData,
        dataAdmin,
        layout: "admin/templates/core-layout",
        baseUrl: true
    });
});

// tampilan data inventory
app.get("/admin/inventories", (req, res) => {
    userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    res.render("admin/data-inventory", {
        title: "App Penjualan - Data Inventory",
        userData,
        layout: "admin/templates/core-layout",
        baseUrl: true
    });
});

// tampilan data transaksi
app.get("/admin/transactions", (req, res) => {
    userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    res.render("admin/data-transaksi", {
        title: "App Penjualan - Data Transaksi",
        userData,
        layout: "admin/templates/core-layout",
        baseUrl: true
    });
});

// tampilan data Profile
app.get("/admin/my_profile", (req, res) => {
    userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    res.render("admin/data-profile", {
        title: "App Penjualan - My Profile",
        userData,
        layout: "admin/templates/core-layout",
        baseUrl: true
    });
});

app.use('/', (req, res) => {
    userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    res.render("admin/not-found", {
        title: "App Penjualan - Page Not Found",
        userData,
        layout: "admin/templates/core-layout",
        baseUrl: true
    });
});

app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
});