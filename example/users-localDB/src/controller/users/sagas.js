import { delay } from "redux-saga";
import * as userServices from "../../services/users.js";

export default {
  /**
   * 获取用户
   *
   * @param {any} { payload }
   * @param {any} effects
   */
  *getUsers({ payload }, effects) {
    // 从 services 获取数据
    const { data, error } = yield effects.call(userServices.getUsers);

    // data && (yield effects.put({
    //   type: "addBatch",
    //   payload: {
    //     list: data.users
    //   }
    // }));

    if (data) {
      yield effects.put({
        type: "addBatch",
        payload: {
          list: data
        }
      });
    }

    // error && ()
  },
  /**
   * 删除一个用户
   *
   * @param {any} { payload }
   * @param {any} effects
   */
  *deleteUser({ payload }, effects) {
    yield delay(1000);
    // 查看是否存在该用户
    const hasUser = yield effects.select((state, key) => {
      return state[this.namespace].list.some(user => {
        return user.key === key;
      });
    }, payload.key);

    yield effects.call(userServices.deleteUser,payload.key);

    hasUser &&
      (yield effects.put({
        type: "delectOne",
        payload
      }));
  },
  /**
   * 新增一个用户
   *
   * @param {any} { payload }
   * @param {any} effects
   */
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
  /**
   * 重置
   *
   * @param {any} { payload }
   * @param {any} effects
   * @returns
   */
  *resetUsers({ payload }, effects) {
    return yield effects.put({
      type: "getUsers",
      payload: {}
    });
  },
  /**
   * 更新一个用户
   *
   * @param {any} { payload }
   * @param {any} effects
   */
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
};
