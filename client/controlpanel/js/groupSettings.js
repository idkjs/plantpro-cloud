import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";

class RenderGroupNameTitle extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            groupname: groupname,
            props: props,
        };
    }
    render() {
        return (<span>"" + {this.state.groupname}</span>);
    }
}


class RenameGroup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            response: null,
            props: props,
            outputTray: <div></div>
        };

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {
        var url = "/rename-group";
        console.log(url);
        axios.post(url,
            { old_name: this.state.props.groupname
            , new_name: document.getElementById("NewGroupName").value
            })
        .then(res => {
            var style = {
                paddingLeft: "1.5em"
            };
            this.setState({
                response: res.status,
                props: this.state.props,
                outputTray: <span style={style}>Valid!</span>});})
            .catch(res => {
                var style = {
                    paddingLeft: "1.5em"
                };
                this.setState({
                    response: 200,
                    props: this.state.props,
                    outputTray: <span style={style}>Invalid!</span>
                });});
    }


    render() {
        var mStyle = {marginTop: "10px",};
        return(
            <div>
                <label for="GroupName"><strong>Enter New Group Name</strong></label>
                <input className="form-control" id="NewGroupName" name="newGroupName" placeholder="Backyard Group" type="text" />
                <button className="btn btn-primary" type="submit" style={mStyle} onClick={this.handleClick}>Rename Group</button>
                {this.state.outputTray}
            </div>
        );
    }
}


class DeleteGroup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            response: null,
            props: props,
            groupname: groupname,
            outputTray: <div></div>
        };

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {
        var url = "/delete-group";
        console.log(url);
        axios.post(url, this.state.props.groupname)
        .then(res => {
            var style = {
                paddingLeft: "1.5em"
            };
            this.setState({
                response: res.status,
                props: this.state.props,
                outputTray: <span style={style}>Valid!</span>});})
            .catch(res => {
                var style = {
                    paddingLeft: "1.5em"
                };
                this.setState({
                    response: 200,
                    props: this.state.props,
                    outputTray: <span style={style}>Invalid!</span>
                });});
    }

    render() {
        return(
                <span>
                <button className="btn btn-danger" type="submit" onClick={this.handleClick}>Delete</button>
                </span>
        );
    }
}

var groupname = location.hash;
groupname = groupname.slice(1); //removes the # from location.hash

ReactDOM.render(
  <RenameGroup groupname={groupname} />,
  document.getElementById("renderRenameForm"));

ReactDOM.render(
  <RenderGroupNameTitle groupname={groupname} />,
  document.getElementById("renderGroupName"));

ReactDOM.render(
  <DeleteGroup groupname={groupname} />,
  document.getElementById("renderDelete"));
