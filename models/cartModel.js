const connection = require("./db-connection.js");

const addCart = async (data) => {
    const cart = await connection.query('insert into tb_cart_temp (id_users, id_products, jumlah) values ($1, $2, $3)', [data[0], data[1], data[2]]);
    return cart;
};

const searchCartByIdUser = async (data) => {
    const cart = await connection.query('select tb_cart_temp.id, tb_cart_temp.id_products, tb_products.nama_product, tb_cart_temp.jumlah as jumlah_beli, tb_products.jumlah as jumlah_barang, harga, photo from tb_cart_temp inner join tb_products on tb_cart_temp.id_products = tb_products.id where id_users = $1 order by id asc', [data]);
    return cart.rows;
};

const searchCart = async (id_users, id_products) => {
    const cart = await connection.query('select * from tb_cart_temp where id_users = $1 and id_products = $2', [id_users, id_products]);
    return cart.rows[0];
};

const updateCart = async (data) => {
    const cart = await connection.query('update tb_cart_temp set jumlah = $1 where id_users = $2 and id_products = $3', [data[2], data[0], data[1]]);
    return cart;
};

const deleteCart = async (data) => {
    const cart = await connection.query('delete from tb_cart_temp where id_users = $1 and id_products = $2', [data[0], data[1]]);
    return cart;
};

module.exports = { addCart, searchCartByIdUser, searchCart, updateCart, deleteCart };