const connection = require("./db-connection.js");

const getAllAdmin = async () => {
    const contacts = await connection.query('select * from tb_users where role_id = 1 order by id asc');
    return contacts.rows;
};

module.exports = { getAllAdmin };