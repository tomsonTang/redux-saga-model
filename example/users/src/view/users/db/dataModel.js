import { delay } from "redux-saga";
import * as userServices from "../../../services/users.js";

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

export { namespace };

export default {
  namespace,
  state: {
    list: [],
    maxKey: 0,
    count: 0
  },
  reducers: {
    updateOne({ list }, { payload }) {
      return {
        list: filterAndUpdateList(list, payload)
      };
    },
    delectOne({ list }, { payload }) {
      const index = list.findIndex(user => {
        return user.key === payload.key;
      });

      const newList = [...list.slice(0, index), ...list.slice(index + 1)];

      return {
        list: newList,
        count: list.length - 1,
        maxKey: newList[newList.length - 1].key
      };
    },
    addOne({ list, maxKey }, { payload }) {
      maxKey++;

      return {
        list: [
          ...list,
          {
            ...payload,
            key: maxKey
          }
        ],
        count: list.length + 1,
        maxKey
      };
    },
    addBatch({ list: stateList }, { payload: { list } }) {
      return {
        list: [...stateList, ...list],
        count: stateList.length + list.length,
        maxKey: list[list.length - 1].key
      };
    },
    clearAll({ list }, { payload }) {
      return { list: [], count: 0, maxKey: 0 };
    }
  },
  sagas: {
    *getUsers({ payload }, effects) {
      // 从 services 获取数据
      const users = (yield userServices.getUsers()).map(user => {
        return {
          name: user.name,
          phone: user.phone,
          website: user.website,
          key: user.id
        };
      });

      yield effects.put({
        type: "addBatch",
        payload: {
          list: users
        }
      });
    },
    *deleteUser({ payload }, effects) {
      yield delay(1000);
      // 查看是否存在该用户
      const hasUser = yield effects.select((state, key) => {
        return state[this.namespace].list.some(user => {
          return user.key === key;
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
          return user.key === key;
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
          return user.key === key;
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
