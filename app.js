const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const moment = require('moment');
const bcrypt = require("bcrypt")
const flash = require('connect-flash');
const { body, validationResult, check } = require("express-validator");
const { getAllUsers, addUser, deleteUser, searchUserByID, updateUser, resetPassword } = require("./models/userModel.js");
const { getAllProducts, addProduct, setProductNotSale, searchProductByID, updateProduct, updateJumlahProduct } = require("./models/productModel.js");
const { getAllInventories, addInventory, deleteInventory, searchInventoryByID } = require("./models/inventoryModel.js");

const app = express();
const host = "localhost";
const port = 7000;
const now = moment().format('DD MMMM YYYY, HH:mm:ss');

app.set("view engine", "ejs");

app.enable('strict routing')

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
app.use(flash());
app.use((req, res, next) => {
    next();
})

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
    });
});

// tampilan data user
app.get("/admin/users", async (req, res) => {
    const userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    const dataUsers = await getAllUsers()
    res.render("admin/data-user", {
        title: "App Penjualan - Data User",
        userData,
        dataUsers,
        message: req.flash('message'),
        layout: "admin/templates/core-layout",
    });
});

// tampilan tambah data user
app.get("/admin/add-user", async (req, res) => {
    const userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    res.render("admin/tambah-user", {
        title: "App Penjualan - Tambah User",
        userData,
        layout: "admin/templates/core-layout",
    });
});

// controller input data user
app.post("/admin/add-user",[
    check('nama', 'Nama Harus Diisi').notEmpty(),
    check('email', 'Email Harus Diisi').notEmpty(),
    check('email', 'Email Tidak Valid').isEmail(),
    check("no_telp", "Nomor Telepon Harus Diisi").notEmpty(),
    check("no_telp", "Nomor Telepon Tidak Valid").isMobilePhone("id-ID"),
    check("role_id", "Role Harus Diisi").notEmpty() ], async (req, res) => {
    const errors = validationResult(req)
    if (errors.errors.length > 0) {
        const userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
        res.render("admin/tambah-user", {
            title: "App Penjualan - Tambah User",
            layout: "admin/templates/core-layout",
            userData,
            errors: errors.errors,
        });
    } else {
        var password = req.params.role_id == 2 ? await passwordHash('admin') : await passwordHash('customer')
        var data = [ req.body.nama, req.body.email, password, req.body.no_telp, req.body.role_id ]
        addUser(data)
        req.flash('message', {'alert': 'success', 'message': 'Data Berhasil Ditambahkan'})
        res.redirect("/admin/users");
    }
});

// controller hapus data user
app.get("/admin/delete-user/:id", async (req, res) => {
    if(await deleteUser(req.params.id)){
        req.flash('message', {'alert': 'success', 'message': 'Data Berhasil Dihapus'})
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Data Gagal Dihapus'})
    }
    res.redirect("/admin/users");   
})

// tampilan ubah data user
app.get('/admin/edit-user/:id', async (req, res) => {
    const userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }

    const dataUser = await searchUserByID(req.params.id);
    res.render('admin/ubah-user', {
        title: "App Penjualan - Ubah Data User",
        layout: "admin/templates/core-layout",
        userData,
        dataUser
    })
})

// controller edit data user
app.post("/admin/edit-user",[
    check('nama', 'Nama Harus Diisi').notEmpty(),
    check('email', 'Email Harus Diisi').notEmpty(),
    check('email', 'Email Tidak Valid').isEmail(),
    check("no_telp", "Nomor Telepon Harus Diisi").notEmpty(),
    check("no_telp", "Nomor Telepon Tidak Valid").isMobilePhone("id-ID"),
    check("role_id", "Role Harus Diisi").notEmpty() ], async (req, res) => {
    const errors = validationResult(req)
    if (errors.errors.length > 0) {
        const userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
        res.render("admin/ubah-user", {
            title: "App Penjualan - Ubah Data User",
            layout: "admin/templates/core-layout",
            userData,
            dataUser: req.body,
            errors: errors.errors,
        });
    } else {
        updateUser(req.body)
        req.flash('message', {'alert': 'success', 'message': 'Data Berhasil Diubah'})
        res.redirect("/admin/users");
    }
});

// controller reset password
app.get("/admin/reset-password/:role_id/:id", async (req, res) => {
    var password = req.params.role_id == 2 ? await passwordHash('admin') : await passwordHash('customer')
    if(await resetPassword(password, req.params.id)){
        req.flash('message', {'alert': 'success', 'message': 'Password Berhasil Direset'})
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Password Gagal Direset'})
    }
    res.redirect("/admin/users");   
})

// tampilan data barang
app.get("/admin/products", async (req, res) => {
    userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    const dataProducts = await getAllProducts()
    res.render("admin/data-products", {
        title: "App Penjualan - Data Barang",
        userData,
        message: req.flash('message'),
        layout: "admin/templates/core-layout",
        dataProducts
    });
});

// tampilan tambah data barang
app.get("/admin/add-product", async (req, res) => {
    userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    
    res.render("admin/tambah-product", {
        title: "App Penjualan - Tambah Data Barang",
        userData,
        layout: "admin/templates/core-layout",
    });
});

// controller input data inventory
app.post("/admin/add-inventory",[
    check('nama_product', 'Nama Product Harus Dipilih').notEmpty(),
    check('harga', 'Harga Harus Diisi').notEmpty(),
    check('harga', 'Harga Harus Berupa Angka').isNumeric(),
], async (req, res) => {
    const errors = validationResult(req)
    if (errors.errors.length > 0) {
        const userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
        res.render("admin/tambah-product", {
            title: "App Penjualan - Tambah Data Product",
            layout: "admin/templates/core-layout",
            userData,
            errors: errors.errors,
        });
    } else {
        var data = [ req.body.nama_product, req.body.harga, '0', 'a.png' ]
        const product = await searchProductByID(data[0])
        var jumlah = parseInt(product.jumlah) + parseInt(data[1]) - parseInt(data[2])
        // console.log(data)
        addInventory(data)
        updateJumlahProduct(jumlah, data[0])

        req.flash('message', {'alert': 'success', 'message': 'Data Berhasil Ditambahkan'})
        res.redirect("/admin/inventories");
    }
});

// tampilan data inventory
app.get("/admin/inventories", async (req, res) => {
    userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    const dataProducts = await getAllInventories()
    res.render("admin/data-inventory", {
        title: "App Penjualan - Data Inventory",
        userData,
        message: req.flash('message'),
        layout: "admin/templates/core-layout",
        dataProducts: dataProducts
    });
});

// tampilan tambah data inventory
app.get("/admin/add-inventory", async (req, res) => {
    userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    const dataProducts = await getAllProducts()
    
    res.render("admin/tambah-inventory", {
        title: "App Penjualan - Tambah Data Inventory",
        userData,
        layout: "admin/templates/core-layout",
        products: dataProducts
    });
});

// controller input data inventory
app.post("/admin/add-inventory",[
    check('id_product', 'Product Harus Dipilih').notEmpty(),
    check('jumlah_masuk', 'Jumlah Masuk Harus Diisi').notEmpty(),
    check('jumlah_masuk', 'Jumlah Masuk Harus Angka').isNumeric(),
    check('jumlah_keluar', 'Jumlah Keluar Harus Diisi').notEmpty(),
    check('jumlah_keluar', 'Jumlah Keluar Harus Angka').isNumeric() ], async (req, res) => {
    const errors = validationResult(req)
    if (errors.errors.length > 0) {
        const userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
        const dataProducts = await getAllProducts()
        res.render("admin/tambah-inventory", {
            title: "App Penjualan - Tambah Data Inventory",
            layout: "admin/templates/core-layout",
            userData,
            errors: errors.errors,
            products: dataProducts
        });
    } else {
        var data = [ req.body.id_product, req.body.jumlah_masuk, req.body.jumlah_keluar, now ]
        const product = await searchProductByID(data[0])
        var jumlah = parseInt(product.jumlah) + parseInt(data[1]) - parseInt(data[2])
        // console.log(data)
        addInventory(data)
        updateJumlahProduct(jumlah, data[0])

        req.flash('message', {'alert': 'success', 'message': 'Data Berhasil Ditambahkan'})
        res.redirect("/admin/inventories");
    }
});

// controller hapus data inventory
app.get("/admin/delete-inventory/:id", async (req, res) => {
    const dataInventory = await searchInventoryByID(req.params.id)
    const dataProduct = await searchProductByID(dataInventory.id_products)
    var jumlah = parseInt(dataProduct.jumlah) - parseInt(dataInventory.jumlah_masuk) + parseInt(dataInventory.jumlah_keluar)
    if(await deleteInventory(req.params.id)){
        updateJumlahProduct(jumlah, dataInventory.id_products)
        req.flash('message', {'alert': 'success', 'message': 'Data Berhasil Dihapus'})
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Data Gagal Dihapus'})
    }
    res.redirect("/admin/inventories");
})

// tampilan data transaksi
app.get("/admin/transactions", (req, res) => {
    userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    res.render("admin/data-transaksi", {
        title: "App Penjualan - Data Transaksi",
        userData,
        layout: "admin/templates/core-layout",
    });
});

// tampilan data Profile
app.get("/admin/my_profile", (req, res) => {
    userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    res.render("admin/data-profile", {
        title: "App Penjualan - My Profile",
        userData,
        layout: "admin/templates/core-layout",
    });
});

app.use('/', (req, res) => {
    userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    res.render("admin/not-found", {
        title: "App Penjualan - Page Not Found",
        userData,
        layout: "admin/templates/core-layout",
    });
});

app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
});