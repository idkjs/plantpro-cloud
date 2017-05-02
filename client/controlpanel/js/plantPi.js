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
        return
            axios
                .get(url)
                .then(res => {
                    var plants = res.data;
                    return plants;
                });
    }
}

class PlantPi {
    constructor() {
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

        this.username = hex2a(getCookie("username"));
    }
    getGroups() {
        var slf = this;
        var url = `/get-groups/${this.state.props.username}`;
        return
            axios
                .get(url)
                .then(res => {
                    var groups = res.data;
                    groups = groups.map((g) => {
                        new Group(slf, g.id, g.name, g.owner_id)});
                    return groups});
    }
}

module.exports = {
    plantPi: new PlantPi()
};
