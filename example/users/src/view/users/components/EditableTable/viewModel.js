export default {
  namespace: "users/ui",
  state: {},
  reducers: {},
  sagas: {
    *onCellChange({ payload }, effects) {
      return yield effects.put({
        type: "users/db/updateUser",
        payload
      });
    },
    *onDelete({ payload }, effects) {
      return yield effects.put({
        type: "users/db/deleteUser",
        payload
      });
    },
    *handleAdd({ payload }, effects) {
      return yield effects.put({
        type: "users/db/addUser",
        payload
      });
    }
  }
};
