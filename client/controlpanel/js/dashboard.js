import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

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
                  {group.name}
                  <span className="caret"></span>
                </a>
              </li>)})
        }
      </ul>);
  }
}

ReactDOM.render(
  <GroupsListing username={username} />,
  document.getElementById('groupsListContainer'));
