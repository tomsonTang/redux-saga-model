/**
 * 更新指定的 user
 *
 * @param {any} list
 * @param {any} payload
 * @returns
 */
function filterAndUpdateList(list, payload) {
  return list.map(user => {
    if (user.key === payload.key) {
      return {
        ...user,
        ...payload //name ,age ,address
      };
    }
    return user;
  });
}

export default {
  /**
   * 更新一个 user
   *
   * @param {any} state
   * @param {any} { payload }
   * @returns
   */
  updateOne(state, { payload }) {
    return {
      ...state,
      list: filterAndUpdateList(state.list, payload)
    };
  },
  /**
   * 删除一个 user
   *
   * @param {any} { list }
   * @param {any} { payload }
   * @returns
   */
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
  /**
   * 增加一个 user
   *
   * @param {any} { list, maxKey }
   * @param {any} { payload }
   * @returns
   */
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
  /**
   * 批量增加 user
   *
   * @param {any} { list: stateList }
   * @param {any} { payload: { list } }
   * @returns
   */
  addBatch({ list: stateList }, { payload: { list } }) {
    return {
      list: [...stateList, ...list],
      count: stateList.length + list.length,
      maxKey: list[list.length - 1].key
    };
  },
  /**
   * 清除所有 user
   *
   * @param {any} { list }
   * @param {any} { payload }
   * @returns
   */
  clearAll({ list }, { payload }) {
    return { list: [], count: 0, maxKey: 0 };
  }
};
