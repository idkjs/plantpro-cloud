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
        var p_buttonStyle = {
          border: "none",
          backgroundColor: "transparent",
          paddingTop: "2px"
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
                <li className="plantElement" key={plant.name}>
                <button className="glyphicon glyphicon-cog pull-left" style={p_buttonStyle}>
                &nbsp;</button><a href="#">{plant.name}></a>
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

class GroupsListing extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          groups: [],
          props: props
        };
    }

    ComponentDidMount() {
        var url = `/get-groups/${this.state.props.username}`;
        console.log("url: " + url);
        axios.get(url)
        .then(res => {
          var groups = res.data;
          console.log(groups);
          this.setState({groups: groups});});
    }

    render() {
        var button_style = {
          border: "none",
          backgroundColor: "transparent",
          paddingTop: "5px"
        };
        var P_Style = {
          fontSize: "13px",
          fontWeight: "bold",
        };
      return (
        <div>
        {
          this.state.groups.map((group) => {
              return(
                <li className="groupElement">
                  <button className="glyphicon glyphicon-cog pull-right" style={button_style}></button>
                  <a href="#">{group.name}</a>
                  <ul className="plantList" key={group.name}>
                    <li><br/><p style={P_Style}>Plants:</p></li>
                      <PlantListing username={this.state.props.username} groupname={group.name} />
                  </ul>
                  <br/>
                </li>
          );})
        }
    	 </div>);
  	}
}

ReactDOM.render(
  <GroupsListing username={username} />,
  document.getElementById('groupRender'));

ReactDOM.render(
  <PlantListing username={username} groupname={'ungrouped'} />,
  document.getElementById(''));
