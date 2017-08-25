import reducers from './reducers.js';
import sagas from './sagas.js';
import state from "./state.js";

export const namespace = "users/db";

export default {
  namespace,
  reducers,
  sagas,
  state,
};
