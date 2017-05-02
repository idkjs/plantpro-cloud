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
        if ((/^(.*)\..*$/g).exec(path) != null) {
            var base = (/^(.*)\..*$/g).exec(path)[1];
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

console.log("a");

var main_stage =
    <Stage stageables={[<AllPlantsView group={{name: "all"}} username={username} route="" />, <PlantDetailView route="plant" />]} />;

console.log(main_stage);

ReactDOM.render(
    main_stage,
    document.getElementById("stage"));
