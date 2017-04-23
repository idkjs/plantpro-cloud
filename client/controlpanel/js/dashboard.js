import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';


class PlantListing extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            plants: [],
            props: props,
        };
    }

    componentDidMount() {
        var url = `/get-devices/${this.state.props.username}/${encodeURIComponent(this.state.props.groupname)}`;
        axios.get(url)
            .then(res => {
                var plants = [];
                var i;
                for (i = 0; i < res.data.length; i++) {
                    var p = res.data[i];
                    if (
                        (this.state.props.groupname === "all")
                        || (this.state.props.groupname === "ungrouped" && p.group === null)
                        || (p.group.name === this.state.props.groupname)) {
                        plants.push(p);
                    }
                }
                console.log(plants);
                this.setState({plants: plants, props: this.state.props});});
    }

    render() {
        console.log(this.state.plants.length);
        var buttonStyle = {
            border: 'none',
            backgroundColor: 'transparent',
            paddingTop: '13px'
        };
        var pStyle = {
            color: "#bcbcbc",
            padding: "3px 20px",
        };
        var contents;
        if (this.state.plants.length == 0) {
            contents = (
                <li><p style={pStyle}>No Plants in Group</p></li>
            );
        }
        else {
            contents =
            this.state.plants.map((plant) => {
                return (
                    <li key={plant.name}>
                        <button onclick="location.href=''" className="glyphicon glyphicon-cog pull-right" style={buttonStyle}></button>
                        <a href=""> {plant.name} </a>
                    </li>
                );
            });
        }
        return (
            <ul className="nav">
            {
                contents
            }
            </ul>
        );
    }
}

class GroupsListing extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            groups: [],
            props: props
        };
    }

    componentDidMount() {
        var url = `/get-groups/${this.state.props.username}`;
        console.log("url: " + url);
        axios.get(url)
            .then(res => {
                var groups = res.data;
                console.log(groups);
                this.setState({groups: groups});});
    }

    render() {
        return (
            <ul className="nav">
                {
                    this.state.groups.map((group) => {
                        return (
                            <li className="dropdown" key={group.name}>
                                <a href="#" className="dropdown-toggle" data-toggle="dropdown">
                                    <p>{group.name}</p>
                                    <span className="caret"></span>
                                </a>
                                <PlantListing username={this.state.props.username} groupname={group.name} />
                            </li>);})
                }
                </ul>);
    }
}

class NewGroupComponent extends React.Component {
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
        var url = "/create-group";
        console.log(url);
        axios.post(url,
            { user: this.state.props.username
            , groupName: document.getElementById("PlantName").value
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
                    color: "red",
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
                <div>
                <input type="text" className="form-control" id="PlantName" name="groupName" placeholder="new group name" />
                <button id="savebutton" className="btn btn-primary" onClick={this.handleClick}>Create Group</button>
                {this.state.outputTray}
                </div>);
    }
}

function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2)
        return parts.pop().split(";").shift();
}

function hex2a(hexx) {
    var hex = hexx.toString();
    var str = "";
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

var username = hex2a(getCookie("username"));

ReactDOM.render(
  <GroupsListing username={username} />,
  document.getElementById("groupsListContainer"));

ReactDOM.render(
  <PlantListing username={username} groupname={"ungrouped"} />,
  document.getElementById("plantListContainer"));

ReactDOM.render(
  <NewGroupComponent username={username} />,
  document.getElementById("show_create_group"));
