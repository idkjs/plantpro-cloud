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
            paddingTop: '3px'
        };
        return (
            <ul className="nav">
            {
                this.state.plants.map((plant) => {
                    return (
                      <li key={plant.name}>
                        <a href="" className="dropdown-toggle">
                          {plant.name}
                          <button className="glyphicon glyphicon-cog pull-right" style={buttonStyle}></button>
                        </a>
                      </li>
                    );
                })
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
              </li>)})
        }
      </ul>);
  }
}

ReactDOM.render(
  <GroupsListing username={username} />,
  document.getElementById('groupsListContainer'));

ReactDOM.render(
  <PlantListing username={username} groupname={'ungrouped'} />,
  document.getElementById('plantListContainer'));
