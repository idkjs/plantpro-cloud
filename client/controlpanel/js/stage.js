import { RenamePlant } from "./renamePlant.js";
import { ChangeGroup } from "./changeGroup.js";
import { plantPi } from "./plantPi.js";

console.log("In stage.js");
console.log(plantPi);

import Chart from "react-chartjs";
import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";

console.log(Chart);
var LineChart = Chart.Line;

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

class CreatePlant extends React.Component {
    constructor(props) {
        super(props);
        this.setNewPlantName = this.setNewPlantName.bind(this);
        this.setNewPlantId = this.setNewPlantId.bind(this);
        this.pushPlant = this.pushPlant.bind(this);
        this.state = {
            newPlantName: "",
            resultTray: <div></div>
        };
    }

    setNewPlantName(ev) {
        var state = this.state;
        state.newPlantName = ev.target.value;
        this.setState(state);
    }

    setNewPlantId(ev) {
        var state = this.state;
        state.newPlantId = ev.target.value;
        this.setState(state);
    }

    pushPlant() {
        console.log(plantPi);
        console.log(this.state);
        var cg = plantPi.createPlant(this.state.newPlantName, this.state.newPlantId);
        cg
            .then(code => {
                var style = {
                    color: (code === 200) ? "green" : "red"
                };
                var msg =
                    (code === 200) ? "OK" : ("error code " + code);
                this.setState(
                    {resultTray: <div style={style}>{msg}</div>});
            })
            .then(x => {
                this.props.onUpdate();
            });
    }

    render() {
        return (
            <div>
                <label for="name">name</label>
                <input
                    type="text"
                    onChange={this.setNewPlantName}
                    name="name" />
                <label for="id">id</label>
                <input
                    type="text"
                    onChange={this.setNewPlantId}
                    name="id" />
                <button onClick={this.pushPlant}>
                    Create Plant
                </button>
                {this.state.resultTray}
            </div>
        );
    }
}

class CreateGroup extends React.Component {
    constructor(props) {
        super(props);
        this.setNewGroupName = this.setNewGroupName.bind(this);
        this.pushGroup = this.pushGroup.bind(this);
        this.state = {
            newGroupName: "ungrouped",
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
        var cg = plantPi.createGroup(this.state.newGroupName);
        cg
            .then(code => {
                var style = {
                    color: (code === 200) ? "green" : "red"
                };
                var msg =
                    (code === 200) ? "OK" : ("error code " + code);
                this.setState(
                    {resultTray: <div style={style}>{msg}</div>});
            })
            .then(x => {
                this.props.onUpdate();
            });
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

class DataTableView extends React.Component {
    constructor(props) {
        super(props);
        this.plant = props.plant;
        this.state = {
            wets: [],
            lights: [],
            temps: []
        };
    }

    componentDidMount() {
        this.fetchData();
    }

    fetchData() {
        console.log("fetching data");
        plantPi
            .getData(this.plant)
            .then(data => {
                this.state['temps'] =
                    data.data
                    .filter(x => x[0] == "ChirpTemp");
                this.state['wets'] =
                    data.data.filter(x => x[0] == "ChirpMoisture");
                this.state['lights'] =
                    data.data.filter(x => x[0] == "ChirpLight");
                this.setState({data: data.data});
            });
    }

    render() {
        var i = 0;
        var rows = [];
        var mtemps;
        var mwets;
        var mlights;
        console.log(this.state);
        for (i = 0; i < this.state.temps.length && i < this.state.wets.length && i < this.state.lights.length ; ++i) {
            rows.push(
                <tr>
                    <td style={{padding: "5px"}}>
                        {this.state.temps[i][1].toFixed(3)}&deg;C
                    </td>
                    <td style={{padding: "5px"}}>
                        {this.state.wets[i][1].toFixed(3)}
                    </td>
                    <td style={{padding: "5px"}}>
                        {this.state.lights[i][1].toFixed(3)}
                    </td>
                </tr>
            );
        }
        console.log(rows);
        var tStyle = {
            padding: "5px"
        };
        return (
            <table style={tStyle}>
                <tbody>
                    <tr>
                        <th style={{padding: "5px"}}>Temperatures</th>
                        <th style={{padding: "5px"}}>Moisture</th>
                        <th style={{padding: "5px"}}>Light</th>
                    </tr>
                    {rows}
                </tbody>
            </table>);
    }
}

class SinglePlantView extends Stageable {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: true,
            data: []
        };
        this.handleClick = this.handleClick.bind(this);
        this.repr = props.plant;
        this.onUpdate = this.onUpdate.bind(this);
    }

    handleClick(ev) {
        this.setState({collapsed: !(this.state.collapsed)});
    }

    onUpdate() {
        this.props.onUpdate();
    }

    render() {
        var detail = <span></span>;
        if (!this.state.collapsed) {
            /* render more things */
            detail =
                <div>
                    <ChangeGroup
                        username={username}
                        plant={this.repr}
                        onUpdate={this.onUpdate} />
                    <DataTableView plant={this.repr} />
                </div>;
        }
        return (
            <div>
                <div onClick={this.handleClick}>{this.repr.name}</div>
                {detail}
            </div>
        );
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
        this.onUpdate = this.onUpdate.bind(this);
    }

    onUpdate() {
        this.updatePlants();
        if (this.props.onUpdate !== undefined) {
            this.props.onUpdate();
        }
    }

    updatePlants() {
        var group;
        if (this.state.props.group === undefined) {
            group = "ungrouped";
        } else {
            group = this.state.props.group;
        }
        plantPi
            .getPlants(group)
            .then(plants => {
                this.setState({plants: []});
                this.setState({plants: plants});
            });
    }

    componentDidMount() {
        this.updatePlants();
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
                        <SinglePlantView
                            onUpdate={this.onUpdate}
                            plant={plant} />
                        /*<ul style={ulStyle} key={plant.id}>
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
                        </ul>*/

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
        this.handleDelete = this.handleDelete.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
    }

    handleDelete() {
        if (confirm("Are you sure you want to delete group " + this.props.group.name)) {
            plantPi
                .deleteGroup(this.props.group.name)
                .then(res => {
                    console.log("Should've just deleted a group");
                    console.log(res);
                    this.onUpdate();
                });
        }
    }

    onUpdate() {
        this.props.onUpdate();
    }

    render() {
        return (
            <div className="group">
                <h1>{this.state.props.group.name}</h1>
                <PlantsListing group={this.state.props.group.name} username={this.props.username} onUpdate={this.onUpdate} />
                <button onClick={this.handleDelete}>
                    Delete group
                </button>
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
        this.onUpdate = this.onUpdate.bind(this);
        this.state["alpha"] = 0;
    }

    componentDidMount() {
        plantPi
            .getGroups()
            .then(groups => {
                console.log("onUpdate");
                console.log(groups);
                this.setState({groups: []});
                this.setState({groups: groups});
                this.setState({alpha: this.state.alpha + 1});});
    }

    onUpdate() {
        plantPi
            .getGroups()
            .then(groups => {
                console.log("onUpdate");
                console.log(groups);
                this.setState({groups: []});
                this.setState({groups: groups});
                this.setState({alpha: this.state.alpha + 1});});
    }

    render() {
        var groupNames = this.state.groups;
        var groups = groupNames.map((group) =>
            {   return (
                    <li>
                        <SingleGroupView group={group} username={this.state.props.username} onUpdate={this.onUpdate} />
                    </li>);});
        return (
            <div>
                <ul>
                    {groups}
                </ul>
                <CreateGroup onUpdate={this.onUpdate} />
            </div>);
    }
}

class AllPlants extends Stageable {
    constructor(props) {
        super(props);
        this.onUpdate = this.onUpdate.bind(this);
        this.state["alpha"] = 0;
    }

    componentDidMount() {
        this.onUpdate();
    }

    onUpdate() {
        plantPi
            .getPlants("all")
            .then(plants => {
                console.log("onUpdate");
                console.log(plants);
                this.setState({plants: []});
                this.setState({plants: plants});
                this.setState({alpha: this.state.alpha + 1});});
    }

    render() {
        return (
            <div>
                <PlantsListing plants={this.state.plants} />
                <CreatePlant onUpdate={this.onUpdate} />
            </div>);
    }
    
}

console.log("a");

var main_stage =
    <Stage
        stageables={
        [   <AllPlants route="" />
            , <PlantDetailView route="plant" />
            , <AllGroupsView route="groups" username={username} />
        ]
        } />;

console.log(main_stage);

ReactDOM.render(
    main_stage,
    document.getElementById("stage"));
