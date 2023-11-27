const connection = require("./db-connection.js");

const getAllProducts = async () => {
    const product = await connection.query('select * from tb_products order by id asc');
    return product.rows;
};

const addProduct = async (data) => {
    const product = await connection.query('insert into tb_products (email, password, nama, no_telp, role_id) values ($1, $2, $3, $4, $5)', [data[1], data[2], data[0], data[3], data[4]]);
    return product;
};

const setProductNotSale = async (data) => {
    const product = await connection.query('delete from tb_products where id = $1', [data]);
    return product;
};

const searchProductByID = async (data) => {
    const product = await connection.query('select * from tb_products where id = $1', [data]);
    return product.rows[0];
};

const updateProduct = async (data) => {
    const product = await connection.query('update tb_products set nama = $1, email = $2, no_telp = $3, role_id = $4 where id = $5', [data.nama, data.email, data.no_telp, data.role_id, data.id]);
    return product;
};

const updateJumlahProduct = async (jumlah, id) => {
    const product = await connection.query('update tb_products set jumlah = $1 where id = $2', [jumlah, id]);
    return product;
};

module.exports = { getAllProducts, addProduct, setProductNotSale, searchProductByID, updateProduct, updateJumlahProduct };