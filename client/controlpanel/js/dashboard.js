require("./usernameRender.js");
require("./stage.js");
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

    handleSubmit() {
        var url = "/rename-plant";
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <input type="text" className="form-control" name="groupName1" placeholder="new plant name" value={this.state.value} onChange={this.handleChange} />
                <button type="submit" className="btn btn-success">Rename Plant</button>
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
            outputTray: <div></div>
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({newGroup: event.target.value});
    }
    handleSubmit() {
        var url = "/change-group";
        console.log("remove from group");
        axios.post(url, /* rm from group... changing group to None */
            { plant:this.state.props.plant.id
            , group: ["None"]
            });
        console.log("add plant to group id: " + this.state.newGroup.id);
        axios.post(url, /* add to group ... Some */
            {  plant:this.state.props.plant.id
             , group: ["Some", this.state.newGroup.id]
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
                this.setState({groups: groups, newGroup: groups[0]});});
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <select value={this.state.value} onChange={this.handleChange}>
                    <option value="" disabled defaultValue>Select a new group</option>
                    {
                        this.state.groups.map((group) => {
                            return (
                                <option key={group.id} value={group}>{group.name}</option>
                            );
                        })
                    }
                </select>
                <button className="btn btn-default" type="button" onClick={this.handleSubmit} >Move Plant</button>
            </form>
        );
    }
}

class PlantListing extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            plants: [],
            props: props,
            displayStyle: true,
        };
        this.showElement = this.showElement.bind(this);
        this.deletionConfirmation = this.deletionConfirmation.bind(this);
    }

    componentDidMount() {
        var url = `/get-devices/${this.state.props.username}/${encodeURIComponent(this.state.props.group.name)}`;
        axios.get(url)
            .then(res => {
                var plants = [];
                var i;
                for (i = 0; i < res.data.length; i++) {
                    var p = res.data[i];
                    console.log(p);
                    /*console.log("groupname: " + this.state.props.groupname + "   p.group: " + p.group);*/
                    if (
                        (this.state.props.group.name === "all")
                        || (this.state.props.group.name === "ungrouped" && p.group === null)
                        || (p.group.name === this.state.props.group.name)) {
                        plants.push(p);
                    }
                }
                console.log(plants);
                this.setState({plants: plants, props: this.state.props});});
    }
    showElement(ref) {
        var thing = this.refs[ref].style.display;
        if (thing === "none")
            this.refs[ref].style.display = "block";
        else
            this.refs[ref].style.display = "none";
    }
    deletionConfirmation(plant){
        if (confirm("Are you sure you want to delete plant " + plant.name + " and all of its data?")){
            //perfrom delete
        }
    }
    render() {
        var pStyle = {paddingLeft: "25px",};
        var buttonStyle = {border:"none", backgroundColor:"transparent", paddingTop:"13px",};
        var divStyle = {display: "none",borderRight: "solid", borderWidth: "1px", paddingRight: "20px", fontWeight: "bold", textAlign: "right"};
        var noBorderStyle = {borderStyle:"none"};
        var displayNoneStyle = {display: "none"};

        if (this.state.plants.length < 1) {
            return (<li style={pStyle}><p>Empty Group</p></li>);
        }
        else { return (
            <li>
            {
                this.state.plants.map((plant) => {
                    return (

                        <ul className="nav innerMenu" key={plant.id}>
                            <li>
                                <button onClick={()=>this.showElement("settings"+plant.id)}  type="button" className="sets glyphicon glyphicon-cog pull-right" style={buttonStyle}></button>
                                <a href="#">{plant.name}</a>
                            </li>
                            <li>
                                <div ref={"settings"+plant.id} className="content" style={divStyle}>
                                    <a href="#" style={noBorderStyle} onClick={()=>this.showElement(plant.id+"Rename")}>Rename</a>
                                    <div ref={plant.id+"Rename"} style={displayNoneStyle}>
                                        <br/>
                                        <RenamePlant username={this.state.props.username} plant={plant} />
                                    </div>
                                    <br/>

                                    <a href="#" style={noBorderStyle} onClick={()=>this.showElement(plant.id+"ChangeGroup")}>Change Group</a>
                                    <div ref={plant.id+"ChangeGroup"} style={displayNoneStyle}>
                                        <div>
                                            <ChangeGroup username={this.state.props.username} plant={plant} />
                                        </div>
                                    </div>

                                    <br/>
                                    <div><a href="#" style={noBorderStyle} onClick={()=>this.deletionConfirmation(plant)}>Delete Plant</a></div>
                                    <br/>
                                </div>
                            </li>
                        </ul>

                    );})
                }
            </li>
        );
        }
    }
}

class GroupsListing extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            groups: [],
            props: props,
            response: null,
            displayStyle: true,
            newGroupName: "",
            outputTray: <div></div>
        };
        this.handleNewGroup = this.handleNewGroup.bind(this);
        this.showElement = this.showElement.bind(this);
        this.setNewGroupName = this.setNewGroupName.bind(this);
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
    handleNewGroup() {
        var url = "/create-group";
        console.log(url);
        axios.post(url,
            { user: this.state.props.username
            , groupName: this.state.newGroupName
            })
        .then(res => {
            var style = {
                paddingLeft: "1.5em"
            };
            var url = `/get-groups/${this.state.props.username}`;
            console.log("url: " + url);
            axios.get(url)
                .then(res => {
                    var groups = res.data;
                    console.log(groups);
                    this.setState({groups: groups});});
            this.setState({
                response: res.status,
                props: this.state.props,
                outputTray: <span style={style}>Valid!</span>});
        })
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

    showElement(){
        this.setState({displayStyle: !this.state.displayStyle});
    }
    setNewGroupName(event){
        this.setState({newGroupName: event.target.value});
    }

    render() {
        let styleDisplay = this.state.displayStyle ? "none" : "block";
        var plusStyle = {fontSize:"13px", float:"left", marginTop:"10px"};
        var liStyle = {fontSize:"12px", float:"right"};
        return (
            <span>

            {
                this.state.groups.map((group) => {
                    return(
                        <li className="dropdown keep-open menuElement" key={group.id} >
                            <a href="#" className="dropdown-toggle" data-toggle="dropdown">{group.name} <span className="caret"></span></a>
                            <ul className="menuDrop dropdown-menu keep-open" role="menu">
                                <PlantListing username={this.state.props.username} group={group} />
                            </ul>
                        </li>
                    );
                })
            }
            <li style={liStyle}><br/><a href="allgroups.html">Manage Groups</a></li>
            <li className="plus" style={plusStyle}><a onClick={()=>this.showElement()}>
                <span className="btn glyphicon glyphicon-plus"></span></a></li>

            <div style={{display: styleDisplay}}>
                <input type="text" className="form-control" name="groupName" placeholder="new group name" value={this.state.newGroupName} onChange={this.setNewGroupName} />
                <button className="btn btn-primary" onClick={this.handleNewGroup}>Create Group</button>
                {this.state.outputTray}
            </div>
            </span>
        );
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


//main_stage.addStageable(<PlantDetailView route="plant" />);

console.log("a");

ReactDOM.render(
  <GroupsListing username={username} />,
  document.getElementById("groupsListContainer"));

ReactDOM.render(
  <PlantListing username={username} group={{id:null,name:"ungrouped"}} />,
  document.getElementById("plantListContainer"));
