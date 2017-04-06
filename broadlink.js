/* jshint node: true */
/* jslint node: true */

module.exports = function (RED) {
    var dns = require("dns");
    var broadlinkjs = require("broadlinkjs");

    var devices = [];

    function createBroadlink(node, global) {
        var b = new broadlinkjs();
        global.set("broadlink", b);

        b.on("deviceReady", (dev) => {
            dns.reverse(dev.host.address, function (err, domains) {
                var name = "";
                if (err !== null) {
                    node.log(err);
                    name = dev.host.address;
                } else {
                    node.log(domains);
                    name = domains;
                }
                devices.push({
                    "id": dev.mac[0] * 100 + dev.mac[1],
                    "name": name,
                    "mac": dev.mac.toString(),
                    "host": dev.host.address
                });
            });
            node.log(JSON.stringify(dev.host) + " " + JSON.stringify(dev.mac));

            dev.on("json", (data) => {
                var msg = {payload: data};
                node.send(msg);
            });
        });

        /* configure interval for discover() */
        b.deviceDiscoverTimerId = setInterval(function () {
            b.discover();
        }, 60000);

        b.discover();

        return b;
    }

    function Broadlinkjs(config) {
        var node = this;
        RED.nodes.createNode(node, config);
        var global = node.context().global;

        var b = global.get("broadlink") || createBroadlink(node, global);

        node.on("close", () => {
            if (b !== null && b.deviceDiscoverTimerId !== null) {
                clearInterval(b.deviceDiscoverTimerId);
                b.deviceDiscoverTimerId = null;
            }
            node.log("close");
        });
    }

    RED.nodes.registerType("broadlink_in", Broadlinkjs);

    function BroadlinkjsOut(config) {
        var node = this;
        RED.nodes.createNode(node, config);
        var global = node.context().global;
        var broadlink = global.get("broadlinkjs");

        var b = global.get("broadlink");

        node.on("input", function (msg) {
            for (var i in b.devices) {
                if (b.devices.hasOwnProperty(i)) {
                    node.log(JSON.stringify(b.devices[i].mac));
                    if (JSON.stringify(b.devices[i].mac) === msg.macAddress) {
                        b.devices[i].runCommand(msg.command, msg.payload);
                    }
                }
            }
        });
    }

    RED.nodes.registerType("broadlink_out", BroadlinkjsOut);

    RED.httpAdmin.get('/broadlinkjs/devices', function (req, res) {
        res.json(devices);
    });

    function BroadlinkConfig(n) {
        RED.nodes.createNode(this, n);
        this.device = n.device;

        var node = this;
    }

    RED.nodes.registerType('broadlink-dev', BroadlinkConfig);
};
