import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";

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
            border: "none",
            backgroundColor: "transparent",
            paddingTop: "2px"
        };
        var pStyle = {
            color: "#bcbcbc",
        };
        var contents;

        if (this.state.plants.length == 0) {
            contents = (
              <li><p style={pStyle}>You have no plants</p></li>
            );
        }
        else {
          contents =
          this.state.plants.map((plant) => {
              return (
                <li className="plantElement" key={plant.name}><button className="glyphicon glyphicon-cog pull-left" style={buttonStyle}>
                  <a href="#">{plant.name}</a></button>
                </li>
              );
          });
        }
        return(
          <div>
          {
            contents
          }
          </div>
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
  document.getElementById('groupRender'));


ReactDOM.render(
  <PlantListing username={username} groupname={"all"} />,
  document.getElementById("expandedPlantContainer"));
