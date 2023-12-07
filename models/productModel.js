const connection = require("./db-connection.js");

const getAllProducts = async () => {
    const product = await connection.query('select * from tb_products order by id asc');
    return product.rows;
};

const addProduct = async (data) => {
    const product = await connection.query('insert into tb_products (nama_product, harga, jumlah, photo) values ($1, $2, $3, $4)', [data[0], data[1], data[2], data[3]]);
    return product;
};

const searchProductByID = async (data) => {
    const product = await connection.query('select * from tb_products where id = $1', [data]);
    return product.rows[0];
};

const updateProduct = async (data) => {
    var product
    if (data.length == 3) {
        product = await connection.query('update tb_products set nama_product = $1, harga = $2 where id = $3', [data[0], data[1], data[2]]);
    } else if (data.length == 4) {
        product = await connection.query('update tb_products set nama_product = $1, harga = $2, photo = $3 where id = $4', [data[0], data[1], data[2], data[3]]);
    }
    return product;
};

const updateJumlahProduct = async (jumlah, id) => {
    const product = await connection.query('update tb_products set jumlah = $1 where id = $2', [jumlah, id]);
    return product;
};

module.exports = { getAllProducts, addProduct, searchProductByID, updateProduct, updateJumlahProduct };