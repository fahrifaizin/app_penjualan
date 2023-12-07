const express = require("express");
const fs = require('fs');
const expressLayouts = require("express-ejs-layouts");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const moment = require('moment');
const bcrypt = require("bcrypt")
const flash = require('connect-flash');
const uploader = require("multer");
const { validationResult, check } = require("express-validator");
const { getAllUsers, addUser, deleteUser, searchUserByID, updateUser, resetPassword, searchUserByEmail, updateProfile } = require("./models/userModel.js");
const { getAllProducts, addProduct, searchProductByID, updateProduct, updateJumlahProduct } = require("./models/productModel.js");
const { getAllInventories, addInventory, deleteInventory, searchInventoryByID } = require("./models/inventoryModel.js");
const { getAllTransaction, getDetailTransaction, addTransaction, addTransactionDetail } = require("./models/transactionModel.js");


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
        cookie: {
            maxAge: (5 * 60000)
        },
        secret: 'secret',
        resave: false,
        saveUninitialized: true,
    })
);
app.use(flash());
app.use((req, res, next) => {
    next();
})

const storage = uploader.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/img/products')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix +'.'+ file.mimetype.split('/')[1])
  }
})

const upload = uploader({ storage: storage })

async function passwordHash (password) {
    const result = await bcrypt.hash(password, 10)
    return result
}

async function passwordVerification (password, passwordHash) {
    const result = await bcrypt.compare(password, passwordHash)
    return result
}

// tampilan halaman home
app.get("/", async (req, res) => {
    userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
    console.log(req.flash('message'))
    res.render("home/index", {
        title: "App Penjualan - Home",
        userData,
        message: req.flash('message'),
        layout: "home/templates/core-layout",
    });
});

// tampilan halaman login
app.get("/login", async (req, res) => {
    if(req.session.authenticated){
            req.flash('message', {'alert': 'warning', 'message': 'Anda Sudah Login!'})
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            res.redirect("/admin");
        } else if (req.session.dataUser.role_id == 3) {
            res.redirect("/");
        }
    } else {
        res.render("home/login", {
            title: "App Penjualan - Login",
            message: req.flash('message'),
            layout: "home/login",
        });
    }
});

// controller logout
app.get("/logout", async (req, res) => {
    req.session.destroy((err) =>{
        if (err) {
            console.log(err)
        } else {
            res.redirect('/login')
        }
    })
});

// controller verify login
app.post("/verify-login",[
    check('email', 'Email Harus Diisi').notEmpty().trim(),
    check('email', 'Email Tidak Valid').isEmail(),
    check("password", "Password Harus Diisi").notEmpty().trim()], async (req, res) => {
    const errors = validationResult(req)
    if (errors.errors.length > 0) {
        const userData = { "nama" : "Moh Fahri Faizin", "role_id" : "1" }
        res.render("home/login", {
            title: "App Penjualan - Login",
            layout: "home/login",
            userData,
            errors: errors.errors,
        });
    } else {
        var dataUser = await searchUserByEmail(req.body.email)
        if(dataUser){
            if (await passwordVerification(req.body.password, dataUser.password)) {
                req.session.authenticated = true
                req.session.dataUser = {id: dataUser.id, role_id: dataUser.role_id}
                if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
                    res.redirect("/admin");
                } else if (req.session.dataUser.role_id == 3) {
                    res.redirect("/");
                }
            } else {
                req.flash('message', {'alert': 'failed', 'message': 'Password Yang Anda Masukan Salah'})
                res.redirect("/login");
            }
        } else {
            req.flash('message', {'alert': 'failed', 'message': 'User Tidak Ditemukan'})
            res.redirect("/login");
        }
    }
});

// tampilan dashboard admin
app.get("/admin", async (req, res) => {
    if(req.session.authenticated){
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            var userData = await searchUserByID(req.session.dataUser.id)
            var data = [(await getAllUsers()).length, (await getAllProducts()).length, (await getAllInventories()).length, (await getAllTransaction()).length]
            res.render("admin/dashboard", {
                title: "App Penjualan - Dashboard",
                userData,
                data,
                message: req.flash('message'),
                layout: "admin/templates/core-layout",
            });
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
            res.redirect("/");
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
});

// tampilan data user
app.get("/admin/users", async (req, res) => {
    if(req.session.authenticated){
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            var userData = await searchUserByID(req.session.dataUser.id)
            const dataUsers = await getAllUsers()
            res.render("admin/data-user", {
                title: "App Penjualan - Data User",
                userData,
                dataUsers,
                message: req.flash('message'),
                layout: "admin/templates/core-layout",
            });
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
            res.redirect("/");
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
});

// tampilan tambah data user
app.get("/admin/add-user", async (req, res) => {
    if(req.session.authenticated){
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            if (req.session.dataUser.role_id == 1){
                var userData = await searchUserByID(req.session.dataUser.id)
                res.render("admin/tambah-user", {
                    title: "App Penjualan - Tambah User",
                    userData,
                    layout: "admin/templates/core-layout",
                });
            } else {
                req.flash('message', {'alert': 'warning', 'message': 'Admin Tidak Bisa Akses Menu Tambah User!'})
                res.redirect("/admin/users");
            }
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
            res.redirect("/");
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
});

// controller input data user
app.post("/admin/add-user",[
    check('nama', 'Nama Harus Diisi').notEmpty().trim(),
    check('email', 'Email Harus Diisi').notEmpty().trim(),
    check('email', 'Email Tidak Valid').isEmail(),
    check("no_telp", "Nomor Telepon Harus Diisi").notEmpty().trim(),
    check("no_telp", "Nomor Telepon Tidak Valid").isMobilePhone("id-ID"),
    check("role_id", "Role Harus Diisi").notEmpty().trim() ], async (req, res) => {
        if(req.session.authenticated){
            if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
                if (req.session.dataUser.role_id == 1){
                    const errors = validationResult(req)
                    if (errors.errors.length > 0) {
                        var userData = await searchUserByID(req.session.dataUser.id)
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
                } else {
                    req.flash('message', {'alert': 'warning', 'message': 'Admin Tidak Bisa Akses Menu Tambah User!'})
                    res.redirect("/admin/users");
                }
            } else {
                req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
                res.redirect("/");
            }
        } else {
            req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
            res.redirect('/login')
        }
});

// controller hapus data user
app.get("/admin/delete-user/:id", async (req, res) => {
    if(req.session.authenticated){
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            if (req.session.dataUser.role_id == 1){
                if(await deleteUser(req.params.id)){
                    req.flash('message', {'alert': 'success', 'message': 'Data Berhasil Dihapus'})
                } else {
                    req.flash('message', {'alert': 'failed', 'message': 'Data Gagal Dihapus'})
                }
                res.redirect("/admin/users");   
            } else {
                req.flash('message', {'alert': 'warning', 'message': 'Admin Tidak Bisa Akses Menu Hapus User!'})
                res.redirect("/admin/users");
            }
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
            res.redirect("/");
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
})

// tampilan ubah data user
app.get('/admin/edit-user/:id', async (req, res) => {
    if(req.session.authenticated){
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            if (req.session.dataUser.role_id == 1){
                var userData = await searchUserByID(req.session.dataUser.id)
            
                const dataUser = await searchUserByID(req.params.id);
                res.render('admin/ubah-user', {
                    title: "App Penjualan - Ubah Data User",
                    layout: "admin/templates/core-layout",
                    userData,
                    dataUser
                })
            } else {
                req.flash('message', {'alert': 'warning', 'message': 'Admin Tidak Bisa Akses Menu Ubah User!'})
                res.redirect("/admin/users");
            }
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
            res.redirect("/");
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
})

// controller edit data user
app.post("/admin/edit-user",[
    check('nama', 'Nama Harus Diisi').notEmpty().trim(),
    check('email', 'Email Harus Diisi').notEmpty().trim(),
    check('email', 'Email Tidak Valid').isEmail(),
    check("no_telp", "Nomor Telepon Harus Diisi").notEmpty().trim(),
    check("no_telp", "Nomor Telepon Tidak Valid").isMobilePhone("id-ID"),
    check("role_id", "Role Harus Diisi").notEmpty().trim() ], async (req, res) => {
        if(req.session.authenticated){
            if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
                if (req.session.dataUser.role_id == 1){
                    const errors = validationResult(req)
                    if (errors.errors.length > 0) {
                        var userData = await searchUserByID(req.session.dataUser.id)
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
                } else {
                    req.flash('message', {'alert': 'warning', 'message': 'Admin Tidak Bisa Akses Menu Ubah User!'})
                    res.redirect("/admin/users");
                }
            } else {
                req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
                res.redirect("/");
            }
        } else {
            req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
            res.redirect('/login')
        }
});

// controller reset password
app.get("/admin/reset-password/:role_id/:id", async (req, res) => {
    if(req.session.authenticated){
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            if (req.session.dataUser.role_id == 1){
                var password = req.params.role_id == 2 ? await passwordHash('admin') : await passwordHash('customer')
                if(await resetPassword(password, req.params.id)){
                    req.flash('message', {'alert': 'success', 'message': 'Password Berhasil Direset'})
                } else {
                    req.flash('message', {'alert': 'failed', 'message': 'Password Gagal Direset'})
                }
                res.redirect("/admin/users");   
            } else {
                req.flash('message', {'alert': 'warning', 'message': 'Admin Tidak Bisa Akses Menu Reset Password!'})
                res.redirect("/admin/users");
            }
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
            res.redirect("/");
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
})

// tampilan data barang
app.get("/admin/products", async (req, res) => {
    if(req.session.authenticated){
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            var userData = await searchUserByID(req.session.dataUser.id)
            const dataProducts = await getAllProducts()
            res.render("admin/data-products", {
                title: "App Penjualan - Data Barang",
                userData,
                message: req.flash('message'),
                layout: "admin/templates/core-layout",
                dataProducts
            });
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
            res.redirect("/");
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
});

// tampilan tambah data barang
app.get("/admin/add-product", async (req, res) => {
    if(req.session.authenticated){
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            if (req.session.dataUser.role_id == 1){
                var userData = await searchUserByID(req.session.dataUser.id)
                res.render("admin/tambah-product", {
                    title: "App Penjualan - Tambah Data Barang",
                    userData,
                    layout: "admin/templates/core-layout",
                });
            } else {
                req.flash('message', {'alert': 'warning', 'message': 'Admin Tidak Bisa Akses Menu Tambah Barang!'})
                res.redirect("/admin/products");
            }
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
            res.redirect("/");
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
});

// tampilan ubah data barang
app.get("/admin/edit-product/:id", async (req, res) => {
    if(req.session.authenticated){
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            if (req.session.dataUser.role_id == 1){
                var userData = await searchUserByID(req.session.dataUser.id)
                const dataProduct = await searchProductByID(req.params.id)
                res.render("admin/ubah-product", {
                    title: "App Penjualan - Ubah Data Barang",
                    userData,
                    layout: "admin/templates/core-layout",
                    dataProduct
                });
            } else {
                req.flash('message', {'alert': 'warning', 'message': 'Admin Tidak Bisa Akses Menu Ubah Barang!'})
                res.redirect("/admin/products");
            }
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
            res.redirect("/");
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
});

// controller input data barang
app.post("/admin/add-product", upload.single('photo'), [ 
    check('nama_product', "Nama Product Harus Diisi").notEmpty().trim(),
    check('harga', 'Harga Harus Diisi').notEmpty().trim(),
    check('harga', 'Harga Harus Berupa Angka').isNumeric() ], async (req, res) => {
    if(req.session.authenticated){
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            if (req.session.dataUser.role_id == 1){
                const errors = validationResult(req)
                if (errors.errors.length > 0) {
                    var userData = await searchUserByID(req.session.dataUser.id)
                    if (req.file) {
                        fs.unlink(req.file.path, (err) => {
                            if (err) {
                                throw err;
                            }
                        })
                    }
                    res.render("admin/tambah-product", {
                        title: "App Penjualan - Tambah Data Product",
                        layout: "admin/templates/core-layout",
                        userData,
                        errors: errors.errors,
                    });
                } else {
                    if (!req.file) {
                        const data = [ req.body.nama_product, req.body.harga, '0', 'default.png' ]
                        await addProduct(data)
                        req.flash('message', {'alert': 'success', 'message': 'Data Berhasil Ditambahkan'})
                    } else {
                        if (/^image/.test(req.file.mimetype)){
                            const data = [ req.body.nama_product, req.body.harga, '0', req.file.filename ]
                            await addProduct(data)
                            req.flash('message', {'alert': 'success', 'message': 'Data Berhasil Ditambahkan'})   
                        } else {
                            const data = [ req.body.nama_product, req.body.harga, '0', 'default.png' ]
                            await addProduct(data)
                            req.flash('message', {'alert': 'failed', 'message': 'Data Berhasil Ditambahkan, Data Harus File Images'})
                        }
                    }
                }
                res.redirect("/admin/products");
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Admin Tidak Bisa Akses Menu Tambah Barang!'})
            res.redirect("/admin/products");
        }
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
            res.redirect("/");
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
});

// controller edit data barang
app.post("/admin/edit-product", upload.single('photo'), [ 
    check('nama_product', "Nama Product Harus Diisi").notEmpty().trim(),
    check('harga', 'Harga Harus Diisi').notEmpty().trim(),
    check('harga', 'Harga Harus Berupa Angka').isNumeric() ], async (req, res) => {
        if(req.session.authenticated){
            if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
                if (req.session.dataUser.role_id == 1){
                
                    const errors = validationResult(req)
                    if (errors.errors.length > 0) {
                        var userData = await searchUserByID(req.session.dataUser.id)
                        if (req.file) {
                            fs.unlink(req.file.path, (err) => {
                                if (err) {
                                    throw err;
                                }
                            })
                        }
                        res.render("admin/ubah-product", {
                            title: "App Penjualan - Ubah Data Product",
                            layout: "admin/templates/core-layout",
                            userData,
                            errors: errors.errors,
                            dataProduct: req.body,
                        });
                    } else {
                        if (!req.file) {
                            const data = [ req.body.nama_product, req.body.harga, req.body.id ]
                            await updateProduct(data)
                            req.flash('message', {'alert': 'success', 'message': 'Data Berhasil Diubah'})
                        } else {
                            if (/^image/.test(req.file.mimetype)){
                                const data = [ req.body.nama_product, req.body.harga, req.file.filename, req.body.id ]
                                const dataBarang = await searchProductByID(req.body.id)
                                if (dataBarang.photo != 'default.png') {
                                    fs.unlink(req.file.destination + '/' + dataBarang.photo, (err) => {
                                        if (err) {
                                            throw err;
                                        }
                                    })
                                }
                                await updateProduct(data)
                                req.flash('message', {'alert': 'success', 'message': 'Data Berhasil Diubah'})   
                            } else {
                                const data = [ req.body.nama_product, req.body.harga, req.body.id ]
                                fs.unlink(req.file.path, (err) => {
                                    if (err) {
                                        throw err;
                                    }
                                })
                                await updateProduct(data)
                                req.flash('message', {'alert': 'failed', 'message': 'Data Berhasil Diubah, Data Harus File Images'})
                            }
                        }
                        res.redirect("/admin/products");
                    }
                } else {
                    req.flash('message', {'alert': 'warning', 'message': 'Admin Tidak Bisa Akses Menu Ubah Barang!'})
                    res.redirect("/admin/products");
                }
            } else {
                req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
                res.redirect("/");
            }
        } else {
            req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
            res.redirect('/login')
        }
});

// tampilan data inventory
app.get("/admin/inventories", async (req, res) => {
    if(req.session.authenticated){
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            var userData = await searchUserByID(req.session.dataUser.id)
            const dataProducts = await getAllInventories()
            res.render("admin/data-inventory", {
                title: "App Penjualan - Data Inventory",
                userData,
                message: req.flash('message'),
                layout: "admin/templates/core-layout",
                dataProducts: dataProducts
            });
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
            res.redirect("/");
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
});

// tampilan tambah data inventory
app.get("/admin/add-inventory", async (req, res) => {
    if(req.session.authenticated){
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            if (req.session.dataUser.role_id == 2){
                var userData = await searchUserByID(req.session.dataUser.id)
                const dataProducts = await getAllProducts()
                
                if (dataProducts.length == 0) {
                    req.flash('message', {'alert': 'warning', 'message': 'Harus Input Data Barang Terlebih Dahulu!'})
                    res.redirect("/admin/inventories");
                }
                
                res.render("admin/tambah-inventory", {
                    title: "App Penjualan - Tambah Data Inventory",
                    userData,
                    layout: "admin/templates/core-layout",
                    products: dataProducts
                });
            } else {
                req.flash('message', {'alert': 'warning', 'message': 'Superadmin Tidak Bisa Akses Menu Tambah Inventory!'})
                res.redirect("/admin/inventories");
            }
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
            res.redirect("/");
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
});

// controller input data inventory
app.post("/admin/add-inventory",[
    check('id_product', 'Product Harus Dipilih').notEmpty().trim(),
    check('jumlah_masuk', 'Jumlah Masuk Harus Diisi').notEmpty().trim(),
    check('jumlah_masuk', 'Jumlah Masuk Harus Angka').isNumeric(),
    check('jumlah_keluar', 'Jumlah Keluar Harus Diisi').notEmpty().trim(),
    check('jumlah_keluar', 'Jumlah Keluar Harus Angka').isNumeric() ], async (req, res) => {
        if(req.session.authenticated){
            if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
                if (req.session.dataUser.role_id == 2){
                
                    const errors = validationResult(req)
                    if (errors.errors.length > 0) {
                        var userData = await searchUserByID(req.session.dataUser.id)
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
                        addInventory(data)
                        updateJumlahProduct(jumlah, data[0])
                
                        req.flash('message', {'alert': 'success', 'message': 'Data Berhasil Ditambahkan'})
                        res.redirect("/admin/inventories");
                    }
                } else {
                    req.flash('message', {'alert': 'warning', 'message': 'Superadmin Tidak Bisa Akses Menu Tambah Inventory!'})
                    res.redirect("/admin/inventories");
                }
            } else {
                req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
                res.redirect("/");
            }
        } else {
            req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
            res.redirect('/login')
        }
});

// controller hapus data inventory
app.get("/admin/delete-inventory/:id", async (req, res) => {
    if(req.session.authenticated){
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            if (req.session.dataUser.role_id == 2){
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
            } else {
                req.flash('message', {'alert': 'warning', 'message': 'Superadmin Tidak Bisa Akses Menu Hapus Inventory!'})
                res.redirect("/admin/inventories");
            }
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
            res.redirect("/");
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
})

// tampilan data transaksi
app.get("/admin/transactions", async (req, res) => {
    if(req.session.authenticated){
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            var userData = await searchUserByID(req.session.dataUser.id)
            const dataTransaksi = await getAllTransaction()
            for (let index in dataTransaksi) {
                dataTransaksi[index].details = await getDetailTransaction(dataTransaksi[index].id);
            }
            res.render("admin/data-transaksi", {
                title: "App Penjualan - Data Transaksi",
                userData,
                message: req.flash('message'),
                layout: "admin/templates/core-layout",
                dataTransaksi
            });
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
            res.redirect("/");
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
});

// tampilan data Profile
app.get("/admin/my-profile", async (req, res) => {
    if(req.session.authenticated){
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            var userData = await searchUserByID(req.session.dataUser.id)
            res.render("admin/data-profile", {
                title: "App Penjualan - My Profile",
                userData,
                message: req.flash('message'),
                layout: "admin/templates/core-layout",
            });
        } else {
            req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
            res.redirect("/");
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
});

// controller edit profile
app.post("/admin/my-profile",[
    check('nama', 'Nama Harus Diisi').notEmpty().trim(),
    check('email', 'Email Harus Diisi').notEmpty().trim(),
    check('email', 'Email Tidak Valid').isEmail(),
    check("no_telp", "Nomor Telepon Harus Diisi").notEmpty().trim(),
    check("no_telp", "Nomor Telepon Tidak Valid").isMobilePhone("id-ID"),
    check("password").trim(), check("passwordConfirm").trim() ], async (req, res) => {
        if(req.session.authenticated){
            if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
                const errors = validationResult(req)
                if(req.body.password != req.body.passwordConfirm){
                    errors.errors.push({
                        'type' : 'field',
                        'value' : '',
                        'msg': 'Password Tidak Sama',
                        'path' : 'password',
                        'location' : 'body',
                    })
                }
                if (errors.errors.length > 0) {
                    var userData = await searchUserByID(req.session.dataUser.id)
                    res.render("admin/data-profile", {
                        title: "App Penjualan - My Profile",
                        layout: "admin/templates/core-layout",
                        userData,
                        message: req.flash('message'),
                        errors: errors.errors,
                    });
                } else {
                    if(req.body.password != ''){
                        var password = await passwordHash(req.body.password)
                        var data = [ req.body.nama, req.body.email, password, req.body.no_telp, req.session.dataUser.id ]
                        updateProfile(data, true)
                    } else {
                        var data = [ req.body.nama, req.body.email, req.body.no_telp, req.session.dataUser.id ]
                        updateProfile(data, false)
                    }
                    req.flash('message', {'alert': 'success', 'message': 'Data Profile Berhasil Diubah'})
                    res.redirect("/admin/my-profile");
                }
            } else {
                req.flash('message', {'alert': 'warning', 'message': 'Access Denied!'})
                res.redirect("/");
            }
        } else {
            req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
            res.redirect('/login')
        }
});

app.use('/', async (req, res) => {
    if(req.session.authenticated){
        var userData = await searchUserByID(req.session.dataUser.id)
        if (req.session.dataUser.role_id == 1 || req.session.dataUser.role_id == 2) {
            res.render("admin/not-found", {
                title: "App Penjualan - Page Not Found",
                userData,
                layout: "admin/templates/core-layout",
            });
        } else {
            res.render("home/not-found", {
                title: "App Penjualan - Page Not Found",
                userData,
                layout: "home/templates/core-layout",
            });
        }
    } else {
        req.flash('message', {'alert': 'failed', 'message': 'Anda Harus Login Terlebih Dahulu!'})
        res.redirect('/login')
    }
});

app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
});