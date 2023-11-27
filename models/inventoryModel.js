const connection = require("./db-connection.js");

const getAllInventories = async () => {
    const user = await connection.query('select tb_inventory_products.id, nama_product, jumlah_masuk, jumlah_keluar, created_at from tb_inventory_products inner join tb_products on tb_inventory_products.id_products = tb_products.id order by id asc');
    return user.rows;
};

const addInventory = async (data) => {
    const user = await connection.query('insert into tb_inventory_products (id_products, jumlah_masuk, jumlah_keluar, created_at) values ($1, $2, $3, $4)', [data[0], data[1], data[2], data[3]]);
    return user;
};

const deleteInventory = async (data) => {
    const user = await connection.query('delete from tb_inventory_products where id = $1', [data]);
    return user;
};

const searchInventoryByID = async (data) => {
    const product = await connection.query('select * from tb_inventory_products where id = $1', [data]);
    return product.rows[0];
};

module.exports = { getAllInventories, addInventory, deleteInventory, searchInventoryByID };