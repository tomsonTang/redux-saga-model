import { delay } from "redux-saga";

const defaultUsers = [
  {
    key: "0",
    name: "lulu",
    age: "18",
    address: "London No. 1 Lake Park",
  },
  {
    key: "1",
    name: "lala",
    age: "28",
    address: "New York No. 1 Lake Park",
  },
  {
    key: "2",
    name: "Jim Green",
    age: "23",
    address: "New York No. 1 Lake Park",
  },
  {
    key: "3",
    name: "John Brown",
    age: "22",
    address: "London No. 1 Lake Park",
  },
  {
    key: "4",
    name: "Joe Black",
    age: "38",
    address: "Sidney No. 1 Lake Park",
  }

];

function filterAndUpdateList(list, payload) {
  return list.map(user => {
    if (user.key === payload.key) {
      return {
        ...user,
        ...payload //name ,age ,address ,delete
      };
    }
    return user;
  });
}

const namespace = "users/db";

export {
  namespace
}

export default {
  namespace,
  state: {
    list: [],
    count: 0
  },
  reducers: {
    updateOne({ list }, { payload }) {
      return {
        list: filterAndUpdateList(list, {
          key: payload.key,
          name: payload.name,
          age: payload.age,
          address: payload.address
        })
      };
    },
    delectOne({ list }, { payload }) {

      const index = list.findIndex((user)=>{
        return user.key === payload.key;
      });

      return {
        list: [...list.slice(0,index),...list.slice(index+1)],
        count: list.length - 1
      };
    },
    addOne({ list }, { payload }) {
      return {
        list: [
          ...list,
          {
            key: list.length + 1,
            name: payload.name,
            age: payload.age,
            address: payload.address,
          }
        ],
        count: list.length + 1
      };
    },
    addBatch({ list }, { payload }) {
      return {
        list: [...list, ...payload.list],
        count: list.length + payload.list.length
      };
    },
    clearAll({ list }, { payload }) {
      return { list: [],count:0 };
    }
  },
  sagas: {
    *getUsers({ payload }, effects) {
      yield delay(100);
      yield effects.put({
        type: "addBatch",
        payload: {
          list: defaultUsers
        }
      });
    },
    *deleteUser({ payload }, effects) {
      // 查看是否存在该用户
      const hasUser = yield effects.select((state, key) => {
        return state[this.namespace].list.some(user => {
          return (user.key === key);
        });
      }, payload.key);

      hasUser &&
        (yield effects.put({
          type: "delectOne",
          payload
        }));
    },
    *addUser({ payload }, effects) {
      // 查看是否存在该用户
      const hasUser = yield effects.select((state, key) => {
        return state[this.namespace].list.some(user => {
          return (user.key === key);
        });
      }, payload.key);

      hasUser ||
        (yield effects.put({
          type: "addOne",
          payload
        }));
    },
    *resetUsers({ payload }, effects) {
      return yield effects.put({
        type: "getUsers",
        payload: {}
      });
    },
    *updateUser({ payload }, effects) {
      // 查看是否存在该用户
      const hasUser = yield effects.select((state, key) => {
        return state[this.namespace].list.some(user => {
          return (user.key === key);
        });
      }, payload.key);

      hasUser &&
        (yield effects.put({
          type: "updateOne",
          payload
        }));
    }
  }
};
