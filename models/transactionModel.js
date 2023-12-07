const connection = require("./db-connection.js");

const getAllTransaction = async () => {
    const user = await connection.query('select tb_transaksi.id, invoice, tb_users.nama, tb_transaksi.created_at from tb_transaksi inner join tb_users on tb_users.id = tb_transaksi.id_users order by tb_transaksi.id asc');
    return user.rows;
};

const getDetailTransaction = async (id) => {
    const user = await connection.query('select nama_product, harga, total from tb_detail_transaksi inner join tb_products on tb_products.id = tb_detail_transaksi.id_product where id_transaksi = $1 order by tb_detail_transaksi.id asc', [id]);
    return user.rows;
};

const addTransaction = async (data) => {
    const user = await connection.query('insert into tb_transaksi (invoice, id_users, created_at) values ($1, $2, $3)', [data[0], data[1], data[2]]);
    return user;
};

const addTransactionDetail = async (data) => {
    const user = await connection.query('insert into tb_detail_transaksi (id_transaksi, id_product, total) values ($1, $2, $3)', [data[0], data[1], data[2]]);
    return user;
};

module.exports = { getAllTransaction, getDetailTransaction, addTransaction, addTransactionDetail };