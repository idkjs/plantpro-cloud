import React from "react";

class RenamePlant extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            groups: [],
            props: props,
            newPlantName: ""
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({newPlantName: event.target.value});
    }

    handleSubmit() {
        var url = "/rename-plant";
    }

    render() {
        return (
            <form onSubmit={this.handleSubmit}>
                <input type="text" className="form-control" name="groupName1" placeholder="new plant name" value={this.state.value} onChange={this.handleChange} />
                <button type="submit" className="btn btn-success">Rename Plant</button>
            </form>
        );
    }
}

module.exports = {
    RenamePlant: RenamePlant
}
