const connection = require("./db-connection.js");

const getAllUsers = async () => {
    const user = await connection.query('select * from tb_users where not role_id = 1 order by id asc');
    return user.rows;
};

const addUser = async (data) => {
    const user = await connection.query('insert into tb_users (email, password, nama, no_telp, role_id) values ($1, $2, $3, $4, $5)', [data[1], data[2], data[0], data[3], data[4]]);
    return user;
};

const deleteUser = async (data) => {
    const user = await connection.query('delete from tb_users where id = $1', [data]);
    return user;
};

const searchUserByID = async (data) => {
    const user = await connection.query('select * from tb_users where id = $1', [data]);
    return user.rows[0];
};

const searchUserByEmail = async (data) => {
    const user = await connection.query('select * from tb_users where email = $1', [data]);
    return user.rows[0];
};

const updateUser = async (data) => {
    const user = await connection.query('update tb_users set nama = $1, email = $2, no_telp = $3, role_id = $4 where id = $5', [data.nama, data.email, data.no_telp, data.role_id, data.id]);
    return user;
};

const updateProfile = async (data, password) => {
    var user;
    if (password == true) {
        user = await connection.query('update tb_users set nama = $1, email = $2, password = $3, no_telp = $4 where id = $5', [data[0], data[1], data[2], data[3], data[4]]);
    } else {
        user = await connection.query('update tb_users set nama = $1, email = $2, no_telp = $3 where id = $4', [data[0], data[1], data[2], data[3]]);
    }
    return user;
};

const resetPassword = async (password, id) => {
    const user = await connection.query('update tb_users set password = $1 where id = $2', [password, id]);
    return user;
};
  

module.exports = { getAllUsers, addUser, deleteUser, searchUserByID, updateUser, resetPassword, searchUserByEmail, updateProfile };