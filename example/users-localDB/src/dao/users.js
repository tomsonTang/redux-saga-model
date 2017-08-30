import low from "lowdb";
import LocalStorage from "lowdb/adapters/LocalStorage";

const adapter = new LocalStorage("db", {
  defaultValue: {
    list: []
  }
});

const db = low(adapter);

function list() {
  return db.get("list");
}

export const getUsers = () => {
  return list().value();
};

export const addUser = user => {
  list().push(user).write();
};

export const deleteUser = key => {
  list().remove({ key }).write();
};

export const uptadeUser = user => {
  list().find({ key: user.key }).assign(user).write();
};

export const setUsers = list => {
  db.set('list',list).write();
  return getUsers();
};

export default {
  getUsers,
  addUser,
  deleteUser,
  uptadeUser,
  setUsers
};
