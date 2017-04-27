require("./usernameRender.js");
import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";

class RenamePlant extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            groups: [],
            props: props,
            newPlantName: ""
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({newPlantName: event.target.value});
    }

    handleSubmit(event) {
        var url = "/rename-plant";
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <input type="text" className="form-control" name="groupName1" placeholder="new plant name" value={this.state.value} onChange={this.handleChange} />
                <button id="renamebutton1" type="submit" className="btn btn-success">Rename Plant</button>
        	</form>
        );
    }
}


class ChangeGroup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            groups: [],
            props: props,
            newGroup: "",
            outputTray: <div></div>
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({newGroup: event.target.value});
    }
    handleSubmit(event) {
        var url = "/change-group";
        axios.post(url, /* rm from group ... None */
            { plant:this.state.props.plant.id
            , group: ["None"]
            })
        axios.post(url, /* add to group ... Some */
            {  plant:this.state.props.plant.id
             , group: ["Some", this.state.newGroup]
            })
        .then(res => {
            var style = {
                paddingLeft: "1.5em"
            };
            this.setState({
                response: res.status,
                props: this.state.props,
                outputTray: <span style={style}>Done!</span>});})
            .catch(res => {
                var style = {
                    color: "red",
                    paddingLeft: "1.5em"
                };
                this.setState({
                    response: 200,
                    props: this.state.props,
                    outputTray: <span style={style}>Failed!</span>
                });});
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
            <form onSubmit={this.handleSubmit}>
                <select value={this.state.value} onChange={this.handleChange}>
                    <option value="" disabled selected>Select a new group</option>
                    {
                        this.state.groups.map((group) {
                            return (
                                <option value={group.id} id={group.name}>{group.name}</option>
                            );
                        })
                    }
            	</select>
            	<button className="btn btn-default" type="button" id="menu1">Move Plant</button>
            </form>
        );
    }
}

class PlantListing extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
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
        var pStyle = {paddingLeft: "25px",};

        if (this.state.plants.length < 1) {
            return (<li style=pStyle><p>Empty Group</p></li>);
        }
        else { return (
            <li>
                <script>
                    $(document).ready(function() {
                        $({'#cog' + this.plantname}).click(function () {
                            $({'#settings' + this.plantname}).slideToggle();
                        });
                    });
                </script>
                <ul className="nav innerMenu">
                    <li>
                        <button id={'cog' + this.state.props.plantname} type="button" className="sets glyphicon glyphicon-cog pull-right" style="border:none;background-color:transparent;padding-top:13px;"><!----></button>
                        <a href="#">{this.state.props.plantname}</a>
                    </li>
                    <li>
                        <div id={'settings' + this.plantname} className="content" style="display: none; border-right: solid; border-width: 1px; padding-right: 20px; font-weight: bold; text-align: right;">
                            <a href="#" style="border-style:none;" onclick="showElement({this.plantname + 'Rename'})">Rename</a>
                            <div id={this.plantname + 'Rename'} style="display: none;">
                                <br/>
                                <RenamePlant username={this.state.props.username} plantname={this.state.props.plant} />
                            </div>
                            <br/>
                            <a href="#" style="border-style:none;" onclick="showElement({'' + this.plantname + 'ChangeGroup'})">Change Group</a>
                            <div id={this.plantname + 'ChangeGroup'} style="display: none;">
                                <div>
                                    <ChangeGroup username={this.state.props.username} groupname={this.state.props.groupname} />
                                </div>
                            </div>
                            <br/>
                            <div><a href="#" style="border-style:none;" onClick="deletionConfirmation({this.plantname})">Delete Plant</a></div>
                            <br/>
                        </div>
                    </li>
                </ul>
            </li>
        );}
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
            {
                this.state.groups.map((group) {
                    return(
                        <li className="dropdown keep-open menuElement" >
            	            <a href="#" className="dropdown-toggle" data-toggle="dropdown">{group.name} <span className="caret"><!----></span></a>9
                	        <ul className="menuDrop dropdown-menu keep-open" role="menu">
                                <PlantListing username={this.state.props.username} groupname={group.name} />
                	        </ul>
                        </li>
                    );
                })
            }
        );
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
