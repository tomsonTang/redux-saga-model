import fetch from "isomorphic-fetch";
import * as userDao from "../dao/users.js";

const fakingURL = "https://jsonplaceholder.typicode.com";
const URLS = {
  fetchAll: `${fakingURL}/users`
};

function toJSON(fetchP) {
  return fetchP.then(checkStatus).then(parseJSON);
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else if (response.headers.get("content-type") === "application/json") {
    const error = new Error("content-type error,is not a json");
    error.response = response;
    throw error;
  } else {
    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

function parseJSON(response) {
  return response.json();
}

function warrpData(json) {
  return { data: json };
}

function warrpError(error) {
  return { error };
}

export const getUsers = async () => {
  let list = await userDao.getUsers();

  if (list.length) {
    return warrpData(list);
  }

  try {
    list = await toJSON(fetch(URLS.fetchAll));

    list = list.map(user => {
      return {
        name: user.name,
        phone: user.phone,
        website: user.website,
        key: user.id
      };
    });

    list = await userDao.setUsers(list);
    return warrpData(list);
  } catch (e) {
    return warrpError(e);
  }
};

export const addUser = async user => {
  return await userDao.addUser(user);
};
export const deleteUser = async key => {
  return await userDao.deleteUser(key);
};
export const uptadeUser = async user => {
  return await userDao.uptadeUser(user);
};
