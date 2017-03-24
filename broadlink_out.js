module.exports = function(RED) {

    function BroadlinkjsOut(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var global = this.context().global;
        var broadlink = global.get('broadlinkjs');

        var b = global.get('broadlink');

        this.on('input', function(msg) {
            for (var i in b.devices) {
                node.log(JSON.stringify(b.devices[i].mac));
                if (JSON.stringify(b.devices[i].mac) === msg.macAddress) {
                    b.devices[i].runCommand(msg.command, msg.payload);
                }
            }
        });
    }
    RED.nodes.registerType("broadlink_out", BroadlinkjsOut);
}
