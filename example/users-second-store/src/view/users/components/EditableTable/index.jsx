import React from "react";
import { Table, Input, Icon, Button, Popconfirm } from "antd";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import EditableCell from "../EditableCell/index.jsx";
import { namespace as dbNamespace } from "../../db/dataModel.js";
import { namespace as uiNamespace } from "./viewModel.js";
import * as action from "../../action.js";

class EditableTable extends React.Component {
  constructor(props) {
    super(props);

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
        title: "phone",
        dataIndex: "phone",
        render: function(text, record, index) {
          return (
            <EditableCell
              value={text}
              onChange={this.onCellChange(index, "phone")}
            />
          );
        }
      },
      {
        title: "website",
        dataIndex: "website",
        render: function(text, record, index) {
          return (
            <EditableCell
              value={text}
              onChange={this.onCellChange(index, "website")}
            />
          );
        }
      },
      {
        title: "operation",
        dataIndex: "operation",
        render: function(text, record, index) {
          return this.props.dataSource.length > 1 ? (
            <Popconfirm
              title="Sure to delete?"
              onConfirm={() => this.onDelete(index)}
            >
              <a href="#">Delete</a>
            </Popconfirm>
          ) : null;
        }
      }
    ];

    columns.forEach(column => {
      column.render && (column.render = this::column.render);
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
      phone: "",
      website: ""
    });
  };
  render() {
    const { dataSource, loading } = this.props;

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
        <Table
          bordered
          dataSource={dataSource}
          columns={columns}
          loading={loading}
        />
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return bindActionCreators(action, dispatch);
};

const mapStateToProps = (state,props) => {
  const usersState = state[`${props.prefix}/${dbNamespace}`];

  return {
    dataSource: usersState.list,
    count: usersState.count,
    loading:
      state.loading.models[dbNamespace] || state.loading.models[uiNamespace]
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(EditableTable);
