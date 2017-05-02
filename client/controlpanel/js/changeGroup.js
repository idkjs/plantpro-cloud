import React from "react";
import axios from "axios";

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
        axios.post(url, /* rm from group... changing group to None */
            { plant:this.state.props.plant.id
            , group: ["None"]
            });
        console.log("add plant to group id: " + this.state.newGroup.id);
        axios.post(url, /* add to group ... Some */
            {  plant:this.state.props.plant.id
             , group: ["Some", this.state.newGroup.id]
            })
        .then(res => {
            var style = {
                paddingLeft: "1.5em"
            };
            this.setState({
                response: res.status,
                props: this.state.props,
                outputTray: <span style={style}>Done!</span>});})
            .catch(res => {
                var style = {
                    color: "red",
                    paddingLeft: "1.5em"
                };
                this.setState({
                    response: 200,
                    props: this.state.props,
                    outputTray: <span style={style}>Failed!</span>
                });});
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
                <select value={this.state.value} onChange={this.handleChange}>
                    <option value="" disabled defaultValue>Select a new group</option>
                    {
                        this.state.groups.map((group) => {
                            return (
                                <option key={group.id} value={group}>{group.name}</option>
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
