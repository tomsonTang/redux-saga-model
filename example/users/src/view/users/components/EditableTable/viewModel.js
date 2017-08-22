import {LOADING} from 'redux-saga-model-loading'
const namespace = "users/ui";

export {
  namespace
};

export default {
  namespace,
  state: {},
  reducers: {},
  sagas: {
    *onCellChange({ payload }, effects) {
      return yield effects.put({
        type: "users/db/updateUser",
        payload,
      });
    },
    *onDelete({ payload }, effects) {
      return yield effects.put({
        type: "users/db/deleteUser",
        payload,
        meta:{
          [LOADING]:true
        }
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
