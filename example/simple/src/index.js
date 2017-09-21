import sagaModel from "../../../src";
import model, { namespace } from "./model.js";

const store = sagaModel.store();

sagaModel.register([model]);

function dispatch() {
  store.dispatch({
    type: `${namespace}/addAsync`,
    payload: Math.floor(Math.random() * 10)
  });
}

try {
  sagaModel.register(model);
} catch (e) {
  console.error(e);
}

dispatch();
setTimeout(()=>{
  console.log('\nafter 0.5s\n');
  // 热替换
  sagaModel.register(model,true);
},500)

setTimeout(()=>{
  console.log('\nafter 1s\n');
  dispatch();
},1000)

setTimeout(()=>{
  console.log('\nafter 1.5s\n');
  // 热替换
  sagaModel.register(model,true);
},1500)

setTimeout(()=>{
  console.log('\nafter 2s\n');
  dispatch();
},2000);


store.subscribe(() => {
  console.log("====================================");
  console.log("current state", store.getState());
  console.log("====================================");
});
