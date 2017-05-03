import { RenamePlant } from "./renamePlant.js";
import { ChangeGroup } from "./changeGroup.js";
import { plantPi } from "./plantPi.js";

import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";

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

class CreateGroup extends React.Component {
    constructor(props) {
        super(props);
        this.setNewGroupName = this.setNewGroupName.bind(this);
        this.pushGroup = this.pushGroup.bind(this);
        this.state = {
            newGroupName: "undefined",
            resultTray: <div></div>
        };
    }

    setNewGroupName(ev) {
        var state = this.state;
        state.newGroupName = ev.target.value;
        this.setState(state);
    }

    pushGroup() {
        console.log(plantPi);
        plantPi
            .createGroup(this.state.newGroupName)
            .then(code => {
                var style = {
                    color: (code === 200) ? "green" : "red"
                };
                var msg =
                    (code === 200) ? "OK" : ("error code " + code);
                this.setState(
                    {resultTray: <div style={style}>{msg}</div>});
            });
        /*axios
            .post(url, params)
            .then(res => {
                console.log(res);
                var state = this.state;
                var style = {
                    color: "green"
                };
                state.resultTray = (<div style={style}>Success!</div>);
                this.setState(state);
            })
            .catch(res => {
                var state = this.state;
                state.resultTray = (
                    <div style={{color: "red"}}>
                        Failure
                    </div>);
                this.setState(state);
            });*/
    }

    render() {
        return (
            <div>
                <input
                    type="text"
                    onChange={this.setNewGroupName} />
                <button onClick={this.pushGroup}>
                    Create Group
                </button>
                {this.state.resultTray}
            </div>
        );
    }
}

class Stageable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            route_base: (/^(.*)(\..*){0,1}$/g).exec(props.route)[1],
            route_param: null
        };
        console.log("Created a new Stageable with route_base " + this.state.route_base);
    }
    componentDidMount() {
        console.log("A stageable component did mount");
        var path = window.location.hash.substring(1);
        this.setState({
            route_base: this.state.route_base,
            route_param: (/^.*(\..*){0,1}$/g).exec(path)[1]
        });
    }
}

class Stage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            active: 0,
            stageables: props.stageables
        };
        this.handleStateChange = this.handleStateChange.bind(this);
    }
    addStageable(stageable) {
        this.setState({
            stageables: this.state.stageables + stageable,
            active: this.state.stageables.length
        });
    }
    handleStateChange(ev) {
        console.log("Handling state change.");
        var path = window.location.hash.substring(1);
        var i = 0;
        if ((/^(.*)(\..*){0,1}$/g).exec(path) != null) {
            var base = (/^(.*)(\..*){0,1}$/g).exec(path)[1];
            console.log("base: " + base);
            console.log(this.state.stageables);
            for (i = 0; i < this.state.stageables.length; i++) {
                var rt = this.state.stageables[i].props.route;
                console.log("checking " + rt);
                if (rt == base) {
                    break;
                }
            }
            if (i == this.state.stageables.length)
                i = 0;
        }
        console.log("New active thing: " + i);
        this.setState({
            active: i,
            stageables: this.state.stageables
        });
    }
    componentDidMount() {
        console.log("The stage did mount.\n");
        window.addEventListener("hashchange", this.handleStateChange, false);
    }
    render() {
        return (
            <div className="stage">
                {this.state.stageables[this.state.active]}
            </div>);
    }
}

class PlantDetailView extends Stageable {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div>
                This is a detail view for a plant.
            </div>);
    }
}

class AllPlantsView extends Stageable {
    constructor(props) {
        super(props);
        this.state["plants"] = [];
        this.state["props"] = props;
    }
    componentDidMount() {
        var url = `/get-devices/${this.state.props.username}/${encodeURIComponent("all")}`;
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
                this.setState({plants: plants});});
    }
    render() {
        return (
            <ul>
                {
                    this.state.plants.map((plant) =>
                        {
                        var id = plant.id;
                        return (<li onClick={() => { window.location = "#plant." + id ;}}>{plant.name}</li>);
                    })
                }
            </ul>);
    }
}

class PlantsListing extends Stageable {
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
        if (this.state.props.plants == undefined || this.state.props.plants.length === 0) {
            var group;
            if (this.state.props.group === undefined) {
                group = "undefined";
            } else {
                group = this.state.props.group.name;
            }
            var url = `/get-devices/${this.state.props.username}/${encodeURIComponent(group)}`;
            axios.get(url)
                .then(res => {
                    var plants = [];
                    var i;
                    for (i = 0; i < res.data.length; i++) {
                        var p = res.data[i];
                        console.log("logging plants...");
                        console.log(p);
                        plants.push(p);
                    }
                    console.log(plants);
                    var state = this.state;
                    state.plants = plants;
                    this.setState(state);
                    console.log(this.state);});
        } else {
            this.state.plants = this.state.props.plants;
        }
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
            //perform delete
        }
    }
    render() {
        var pStyle = {paddingLeft: "25px",};
        var buttonStyle = {border:"none", backgroundColor:"transparent", paddingTop:"13px",};
        var divStyle = {display: "none",borderLeft: "solid", borderWidth: "1px", marginLeft: "1em", paddingLeft: "1em"};
        var ulStyle = {listStyle: "none"};
        var noBorderStyle = {borderStyle:"none"};
        var displayNoneStyle = {display: "none"};

        console.log("about to return from PlantsListing.render");
        console.log(this.state);
        var plants = this.state.plants;
        console.log(plants.length);

        if (plants.length === 0) {
            return (<li style={pStyle}><p>Empty Group</p></li>);
        }
        else { return (
            <div>
            {
                plants.map((plant) => {
                    return (

                        <ul style={ulStyle} key={plant.id}>
                            <li>
                                <button onClick={()=>this.showElement("settings"+plant.id)}  type="button" className="sets glyphicon glyphicon-cog" style={buttonStyle}></button>
                                <a href="#">{plant.name}</a>
                            </li>
                            <li>
                                <div ref={"settings"+plant.id} className="content" style={divStyle}>
                                    <a href="#" style={noBorderStyle} onClick={()=>this.showElement(plant.id+"Rename")}>Rename</a>
                                    <div ref={plant.id+"Rename"} style={displayNoneStyle}>
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
                                </div>
                            </li>
                        </ul>

                    );})
                }
            </div>
        );
        }
    }
}

class SingleGroupView extends React.Component {
    constructor(props) {
        super(props);
        console.log(this.state);
        this.state = {};
        this.state["props"] = props;
    }

    componentDidMount() {
        plantPi
            .getPlants(this.state.props.group.name)
            .then(plants => {
                this.state["plants"] = plants;
            });
    }
    render() {
        return (
            <div className="group">
                <h1>{this.state.props.group.name}</h1>
                <PlantsListing plants={this.state.plants} username={this.props.username} />
            </div>);
    }
}

class AllGroupsView extends Stageable {
    constructor(props) {
        super(props);
        this.state["groups"] = [];
        this.state["props"] = {
            username: props.username
        };
    }
    componentDidMount() {
        var url = `/get-groups/${this.state.props.username}`;
        console.log("url: " + url);
        axios.get(url)
            .then(res => {
                var groups = res.data;
                console.log(groups);
                var state = this.state;
                state["groups"] = groups;
                console.log("setting groups ");
                console.log(groups);
                this.setState(state);});
    }
    render() {
        var groups = this.state["groups"].map((group) =>
            {   return (
                    <li>
                        <SingleGroupView group={{name: group.name}} username={this.state.props.username} />
                    </li>);});
        return (
            <div>
                <ul>
                    {groups}
                </ul>
                <CreateGroup />
            </div>);
    }
}

console.log("a");

var main_stage =
    <Stage
        stageables={
        [   <PlantsListing group={{name: "all", id: null}} username={username} route="" />
            , <PlantDetailView route="plant" />
            , <AllGroupsView route="groups" username={username} />
        ]
        } />;

console.log(main_stage);

ReactDOM.render(
    main_stage,
    document.getElementById("stage"));
