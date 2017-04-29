import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            props: props,
            username: "",
            password: "",
            outputTray: <div></div>
        };
        this.updateUname = this.updateUname.bind(this);
        this.updatePass = this.updatePass.bind(this);
        this.handleLogin = this.handleLogin.bind(this);
    }
    updateUname(event) {
        this.setState({username: event.target.value});
    }
    updatePass(event) {
        this.setState({password: event.target.value});
    }
    handleLogin() {
        console.log(this.state.username + "/" + this.state.password);
        var url = "/login";
        var params = "username="+this.state.username+"&password="+this.state.password;
        axios.post(url, params, {maxRedirects: 10}
        ).then(res => {
            axios.get("../controlpanel/dashboard.html").then(res1 => {
                console.log(res1.request.responseURL);
                window.location = res1.request.responseURL;
            });
        }).catch(res => {
                var style = {
                    color: "#cc0000",
                    fontStyle: "italic",
                };
                this.setState({
                    response: 200,
                    props: this.state.props,
                    outputTray: <span style={style}>Invalid Login!</span>,
                });});
    }

    render() {
        var alignStyle = {textAlign: "center"};
        var h2Style = {margin:"0 0 10px 0", textAlign:"center"};
        return (
            <div>
                <h2 style={h2Style}>Login</h2>
                {this.state.outputTray}
                <div className="login-container">
                    <label for="username">Username:</label>
                    <input name="username" type="text" placeholder="username" value={this.state.username} onChange={this.updateUname} />
                    <label for="password">Password:</label>
                    <input name="password" type="password" placeholder="password" value={this.state.password} onChange={this.updatePass} />
                    <div style={alignStyle}><input type="submit" value="Login" onClick={this.handleLogin} /></div>
                </div>
            </div>
        );
    }
}

class Signup extends React.Component {

}

ReactDOM.render(
    <Login />,
    document.getElementById("hidden-login"));
