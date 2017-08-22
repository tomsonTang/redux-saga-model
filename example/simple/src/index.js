import sagaModel from "redux-saga-model";
import model, { namespace } from "./model.js";

sagaModel.register(model);

const store = sagaModel.store();

function dispatch() {
  store.dispatch({
    type: `${namespace}/addAsync`,
    payload: Math.floor(Math.random() * 10)
  });
}

dispatch();

setTimeout(()=>{
  console.log('after 2s\n');
  dispatch();
},2000);

store.subscribe(() => {
  console.log("====================================");
  console.log("current state", store.getState());
  console.log("====================================");
});
