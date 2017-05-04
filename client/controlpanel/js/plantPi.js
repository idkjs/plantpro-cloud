import axios from "axios";

class Plant {
    constructor(id, name, group) {
        this.id = id;
        this.name = name;
        this.group = group;
    }
}

class Group {
    constructor(pp, id, name, owner_id) {
        this.pp = pp;
        this.id = id;
        this.name = name;
        this.owner_id = owner_id;
    }

    getPlants() {
        var gn = encodeURIComponent(this.name);
        var url = `get-devices/${this.pp.username}/${gn}`;
        axios
            .get(url)
            .then(res => {
                var plants = res.data;
                return plants;
            });
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

class PlantPi {
    constructor() {
        this.username = hex2a(getCookie("username"));
    }

    getGroups() {
        var slf = this;
        var url = `/get-groups/${this.username}`;
        return (axios
            .get(url)
            .then(res => {
                var groups = res.data;
                groups = groups.map((g) => {return new Group(this, g.id, g.name, g.owner_id);});
                return groups;}));
    }

    getPlants(group) {
        console.log("Getting plants");
        console.log(group);
        var groupName = encodeURIComponent(group);
        var url = `/get-devices/${this.username}/${groupName}`;
        return (axios
            .get(url)
            .then(res => {
                return res.data;
            }));
    }

    getData(plant) {
        var plantId = encodeURIComponent(plant.id);
        var url = `/get-data/${plantId}`;
        return (axios
            .get(url)
            .then(res => {
                console.log("got data");
                console.log(res);
                return res;
            }));
    }

    createGroup(name) {
        var url = "/create-group";
        var params = {
            user: this.username,
            groupName: name
        };
        return (axios
            .post(url, params)
            .then(res => {
                console.log(res);
                console.log(res.status);
                return res.status;
            })
            .catch(res => {
                console.log(res.status);
                return res.status;
            }));
    }

    createPlant(name, device) {
        var params = new URLSearchParams();
        var url = "/associate-device";
        params.append("name", name);
        params.append("device", device);
        return (axios
            .post(url, params)
            .then(res => {
                return res.status;
            })
            .catch(res => {
                return res.status;
            }));
    }

    deleteGroup(name) {
        var params = name;
        var url = "/delete-group";
        return (axios
            .post(url, params)
            .then(res => {
                console.log(res);
                return res.status;
            })
            .catch(res => {
                console.log(res);
                return res.status;
            }));
    }
}

var plantPi = new PlantPi();
console.log("In plantPi.js");
console.log(plantPi);
console.log(PlantPi);

module.exports = {
    plantPi: plantPi
};
