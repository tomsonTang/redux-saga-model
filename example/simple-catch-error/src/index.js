import sagaModel from "../../../src";
import model, { namespace } from "./model.js";


const store = sagaModel.store();

sagaModel.register([model]);
sagaModel.use({
  onError:(error,dispatch)=>{
    console.log('catch-error:')
    console.log(error);
  }
})

function dispatch() {
  store.dispatch({
    type: `${namespace}/addAsync`,
    payload: Math.floor(Math.random() * 10)
  });
}

dispatch();


store.subscribe(() => {
  console.log("====================================");
  console.log("current state", store.getState());
  console.log("====================================");

});
