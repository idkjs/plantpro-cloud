import React from "react";
import axios from "axios";
import {plantPi} from "./plantPi.js";

class ChangeGroup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            groups: [],
            props: props,
            outputTray: <div></div>
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({newGroup: event.target.value});
    }

    handleSubmit() {
        var url = "/change-group";
        console.log("remove from group");
        console.log(this.state);
        axios.post(url, /* rm from group... changing group to None */
            { plant:this.state.props.plant.id
            , group: null
            });
        console.log("add plant to group id: " + this.state.newGroup);
        axios.post(url, /* add to group ... Some */
            {  plant:this.state.props.plant.id
             , group: parseInt(this.state.newGroup)
            })
        .then(res => {
            var style = {
                paddingLeft: "1.5em"
            };
            this.setState({
                response: res.status,
                props: this.state.props,
                outputTray: <span style={style}>Done!</span>});
            this.props.onUpdate();})
        .catch(res => {
            var style = {
                color: "red",
                paddingLeft: "1.5em"
            };
            this.setState({
                response: 200,
                props: this.state.props,
                outputTray: <span style={style}>Failed!</span>});});
    }

    componentDidMount() {
        var url = `/get-groups/${this.state.props.username}`;
        console.log("url: " + url);
        axios.get(url)
            .then(res => {
                var groups = res.data;
                console.log(groups);
                this.setState({groups: groups, newGroup: groups[0]});});
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <select onChange={this.handleChange}>
                    <option value="ungrouped" defaultValue>Ungrouped</option>
                    {
                        this.state.groups.map((group) => {
                            return (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            );
                        })
                    }
                </select>
                <button className="btn btn-default" type="button" onClick={this.handleSubmit} >Move Plant</button>
            </form>
        );
    }
}

module.exports = {
    ChangeGroup: ChangeGroup
};
