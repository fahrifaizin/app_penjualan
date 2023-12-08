const connection = require("./db-connection.js");

const getAllTransaction = async () => {
    const transaction = await connection.query('select tb_transaksi.id, invoice, tb_users.nama, tb_transaksi.created_at from tb_transaksi inner join tb_users on tb_users.id = tb_transaksi.id_users order by tb_transaksi.id desc');
    return transaction.rows;
};

const getAllTransactionByUserId = async (data) => {
    const transaction = await connection.query('select tb_transaksi.id, invoice, tb_users.nama, tb_transaksi.created_at from tb_transaksi inner join tb_users on tb_users.id = tb_transaksi.id_users where tb_transaksi.id_users = $1 order by tb_transaksi.id desc', [data]);
    return transaction.rows;
};

const getTransactionByInv = async (data) => {
    const transaction = await connection.query('select id from tb_transaksi where invoice = $1', [data]);
    return transaction.rows[0];
};

const getDetailTransaction = async (id) => {
    const transaction = await connection.query('select nama_product, harga_product, total_product from tb_detail_transaksi where id_transaksi = $1 order by tb_detail_transaksi.id asc', [id]);
    return transaction.rows;
};

const addTransaction = async (data) => {
    const transaction = await connection.query('insert into tb_transaksi (invoice, id_users, created_at) values ($1, $2, $3)', [data[0], data[1], data[2]]);
    return transaction;
};

const addTransactionDetail = async (data) => {
    const transaction = await connection.query('insert into tb_detail_transaksi (id_transaksi, nama_product, total_product, harga_product) values ($1, $2, $3, $4)', [data[0], data[1], data[2], data[3]]);
    return transaction;
};

const getMostPopularProduct = async () => {
    const transaction = await connection.query('select nama_product, sum(total_product) as total_product from tb_detail_transaksi group by nama_product order by total_product desc limit 3');
    return transaction.rows;
};


module.exports = { getAllTransaction, getDetailTransaction, addTransaction, addTransactionDetail, getAllTransactionByUserId, getTransactionByInv, getMostPopularProduct };