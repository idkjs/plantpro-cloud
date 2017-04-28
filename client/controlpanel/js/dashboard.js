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
                    <option value="" disabled defaultValue>Select a new group</option>
                    {
                        this.state.groups.map((group) => {
                            return (
                                <option key={group.id} value={group.id} id={group.name}>{group.name}</option>
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
                this.toggleSlide = this.toggleSlide.bind(this);
                this.showElement = this.showElement.bind(this);
                this.setState({plants: plants, props: this.state.props});});
    }
    toggleSlide(ref) { /* put this in the button ahref onClick={()=>this.toggleSlide('ref_to_be_slid') */
        $(this.refs[ref]).slideToggle()
    }
    showElement(id) {
        $(this.refs[ref]).slideToggle()
    };
    deletionConfirmation(plantDelete){
        if (confirm("Are you sure you want to delete plant " + plantDelete + "?")){
            //perfrom delete
        }
    }
    render() {
        var pStyle = {paddingLeft: "25px",};
        var buttonStyle = {border:"none", backgroundColor:'transparent', paddingTop:'13px',};
        var divStyle = {display: 'none', borderRight: 'solid', borderWidth: '1px', paddingRight: '20px', fontWeight: 'bold', textAlign: 'right'};
        var noBorderStyle = {borderStyle:'none'};
        var displayNoneStyle = {display: "none"};

        if (this.state.plants.length < 1) {
            return (<li style={pStyle}><p>Empty Group</p></li>);
        }
        else { return (
            <li>
                <ul className="nav innerMenu">
                    <li>
                        <button onClick={()=>this.toggleSlide('settings'+this.plantname)}  type="button" className="sets glyphicon glyphicon-cog pull-right" style={buttonStyle}></button>
                        <a href="#">{this.state.props.plantname}</a>
                    </li>
                    <li>
                        <div ref={'settings' + this.plantname} className="content" style={divStyle}>
                            <a href="#" style={noBorderStyle} onClick={()=>this.showElement(this.plantname+'Rename')}>Rename</a>
                            <div ref={this.plantname+'Rename'} style={displayNoneStyle}>
                                <br/>
                                <RenamePlant username={this.state.props.username} plantname={this.state.props.plant} />
                            </div>
                            <br/>
                            <a href="#" style={noBorderStyle} onClick={()=>this.showElement(this.plantname+'ChangeGroup')}>Change Group</a>
                            <div ref={this.plantname+'ChangeGroup'} style={displayNoneStyle}>
                                <div>
                                    <ChangeGroup username={this.state.props.username} groupname={this.state.props.groupname} />
                                </div>
                            </div>
                            <br/>
                            <div><a href="#" style={noBorderStyle} onClick=''>Delete Plant</a></div>
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
            props: props,
            response: null,
            displayStyle: true,
            outputTray: <div></div>
        };
        this.handleNewGroup = this.handleNewGroup.bind(this);
        this.showElement = this.showElement.bind(this);
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
    handleNewGroup(e) {
        var url = "/create-group";
        console.log(url);
        axios.post(url,
            { user: this.state.props.username
            , groupName: document.getElementById("newGroupName").value
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
        this.setState({displayStyle: !this.state.displayStyle})
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
                                <PlantListing username={this.state.props.username} groupname={group.name} />
                	        </ul>
                        </li>
                    );
                })
            }
            <li style={liStyle}><br/><a href="allgroups.html">Manage Groups</a></li>
            <li className="plus" style={plusStyle}><a onClick={()=>this.showElement()}>
                <span className="btn glyphicon glyphicon-plus"></span></a></li>

            <div id="show_create_group" style={{display: styleDisplay}}>
                <input type="text" className="form-control" id="newGroupName" name="groupName" placeholder="new group name" />
                <button id="savebutton" className="btn btn-primary" onClick={this.handleNewGroup}>Create Group</button>
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

ReactDOM.render(
  <GroupsListing username={username} />,
  document.getElementById("groupsListContainer"));

ReactDOM.render(
  <PlantListing username={username} groupname={"ungrouped"} />,
  document.getElementById("plantListContainer"));
