import 'babel-polyfill';
import React from 'react'
import EditableTable from './components/EditableTable/index.jsx'
import PropTypes from 'prop-types';
import usersModels from './model.js';
import './index.css';

export default class View extends React.Component{

    static contextTypes ={
      store:PropTypes.object
    }

    componentWillMount = () => {
      this.context.store.register([...usersModels])
    }

    render(){
      return <EditableTable prefix={this.context.store.prefix()} />;
    }
  }
