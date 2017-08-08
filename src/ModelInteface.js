const SEP = '/';

/**
 * 
 * 
 * @param {string} fieldName 
 * @param {object} fieldValue 
 */
function register(fieldName,fieldValue){
  if(!this[fieldName]){
      this[fieldName] = fieldValue;
    }
    else{
      this[fieldName] = {
        ...this[fieldName],
        ...fieldValue,
      };
    }

    return this;
}


export default class ModelInteface{

  config(opts){
    for (let key in opts) {
      if (opts.hasOwnProperty(key)) {
        methodName = `set${key[0].toUpperCase() + key.slice(1)}` ;
        this[methodName](opts[key]);
      }
    }
  }

  setNamespaces(namespace){
    if(!this.namespaces){
      this.namespaces = namespace;
    }
    else{
      this.namespaces += `${SEP}${namespace}`;
    }
    return this;
  }

  setStates(states){
    return this::register('setStates',states);
  }

  setSagas(sagas){
    return this::register('setSagas',sagas);
  }

  setReducers(reducers){
    return this::register('setReducers',reducers);
  }

  setSubscriptions(subscriptions){
    return this::register('setSubscriptions',subscriptions);
  }

};