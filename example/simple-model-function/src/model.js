import { delay } from "redux-saga";

export const namespace = `i'm a namespace`;

export default () => {
  return {
    namespace,
    state: {
      num: 0
    },
    reducers: {
      add(state, { payload }) {
        console.log({ num: state.num + payload });
        return { num: state.num + payload };
      }
    },
    sagas: {
      *addAsync(action, effects) {
        console.log("get action", action);
        yield delay(1000);

        yield effects.put({
          type: "add",
          payload: action.payload
        });
      }
    }
  };
};
