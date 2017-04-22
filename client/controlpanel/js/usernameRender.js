import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

class UsernameRender extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: username,
    };
  }


  render() {
    return (<span> {this.state.props.username}</span>);
  }

}

ReactDOM.render(
    <UsernameRender username={username} />,
    document.getElementById('usernameRenderTarget'));
