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
            paddingTop: '2px'
        };
        var pStyle = {
            color: '#bcbcbc',
        };
        var li_style = {
            border: 'none',
            backgroundColor: 'transparent',
            paddingTop: '2px'
        };
        var a_style = {
            fontSize: '18px',
        }
        var contents;
        if (this.state.plants.length == 0) {
          contents = (
              <li><p style={pStyle}>You have no plants</p></li>
              );
        }
        else {
          this.state.plants.map((plant) => {
              return (
                  <li className="plantElement" key={plant.name}><button className="glyphicon glyphicon-cog pull-left" style={buttonStyle}>
                  <a href="#">{plant.name}</a></button>
                  </li>
                  );
              })
        }
    }
}
<li class="plantElement"><button onclick="" class="glyphicon glyphicon-cog pull-left" style="border:none;background-color:transparent;padding-top: 2px;"></button>&nbsp;<a id="plantName" href="#" style="font-size: 18px;">Venus Flytrap</a></li>

ReactDOM.render(
  <PlantListing username={username} groupname={'all'} />,
  document.getElementById('explandedPlantContainer'));
