import React from "react";
import { Table, Input, Icon, Button, Popconfirm } from "antd";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import EditableCell from "../EditableCell/index.jsx";
import { namespace } from "../../db/dataModel.js";
import * as action from "./action.js";

const columns = [
  {
    title: "name",
    dataIndex: "name",
    width: "30%",
    render: function(text, record, index) {
      return (
        <EditableCell
          value={text}
          onChange={this.onCellChange(index, "name")}
        />
      );
    }
  },
  {
    title: "age",
    dataIndex: "age",
    render: function(text, record, index) {
      return (
        <EditableCell value={text} onChange={this.onCellChange(index, "age")} />
      );
    }
  },
  {
    title: "address",
    dataIndex: "address",
    render: function(text, record, index) {
      return (
        <EditableCell
          value={text}
          onChange={this.onCellChange(index, "address")}
        />
      );
    }
  },
  {
    title: "operation",
    dataIndex: "operation",
    render: function(text, record, index){
      return this.props.dataSource.length > 1
        ? <Popconfirm
            title="Sure to delete?"
            onConfirm={() => this.onDelete(index)}
          >
            <a href="#">Delete</a>
          </Popconfirm>
        : null;
    }
  }
];

class EditableTable extends React.Component {
  constructor(props) {
    super(props);

    columns.forEach((column)=>{
      column.render &&(
        column.render = this::column.render
      )
    });

    this.columns = columns;
  }

  componentWillMount = () => {
    this.props.getUsers();
  };

  onCellChange = (index, key) => {
    const { dataSource, onCellChange } = this.props;
    return value => {
      onCellChange({
        ...dataSource[index],
        [key]: value
      });
    };
  };
  onDelete = index => {
    const { dataSource, onDelete } = this.props;
    onDelete({
      key: dataSource[index].key
    });
  };
  handleAdd = () => {
    this.props.handleAdd({
      name: "",
      age: "",
      address: ""
    });
  };
  render() {
    const { dataSource } = this.props;

    const columns = this.columns;
    return (
      <div>
        <Button
          className="editable-add-btn"
          onClick={this.handleAdd}
          style={{ marginBottom: 20 }}
        >
          新增
        </Button>
        <Table bordered dataSource={dataSource} columns={columns} />
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return bindActionCreators(action, dispatch);
};

const mapStateToProps = state => {
  const usersState = state[namespace];

  return {
    dataSource: usersState.list,
    count: usersState.count
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(EditableTable);
