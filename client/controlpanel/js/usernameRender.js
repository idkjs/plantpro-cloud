import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";

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
    <UsernameRender username={username} />,
    document.getElementById("usernameRenderTarget"));
