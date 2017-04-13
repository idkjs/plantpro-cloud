import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';


class PlantListing extends React.Component {
    constructor(props) {
        super(props);
        console.log(props);
        this.state = {
            plants: [],
            props: props,
        };
    }
    
    componentDidMount() {
        var url = `/get-devices/${this.state.props.username}/${this.state.props.groupname}`;
        console.log(this.state);
        console.log(url);
        axios.get(url)
            .then(res => {
                var plants = [];
                for (var p in res.data) {
                    if (p.group.name === this.state.props.groupname) 
                        plants.push(p);
                }
                console.log(plants);
                this.setState({plants: plants});});
    }

    render() {
        return (
            {
                this.state.plants.map((plant) => {
                    return (
                        <li key={plant.name}>
                            <a href=""><p>{plant.name}</p>
                                <button key={plant.name} onclick="" class="glyphicon glyphicon-cog pull-right" style="border:none;background-color:trans parent;padding-top:3px;">
                                </button>
                            </a>
                        </li>
                    );
                })
            }

        );
    }
}




class GroupsListing extends React.Component {
  constructor(props) {
    super(props);
    console.log(props);
    this.state = {
      groups: [],
      props: props
    };
  }

  componentDidMount() {
    var url = `/get-groups/${this.state.props.username}`;
    console.log(this.state);
    console.log(url);
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
  document.getElementByID('plantListContainer'));
