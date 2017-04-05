var devices = [];

var dns = require('dns');

module.exports = function(RED) {
    function createBroadlink(node, global, broadlink) {
       var b = new broadlink();
       global.set('broadlink', b);

       b.on("deviceReady", (dev) => {
           dns.reverse(dev.host.address, function(err,domains){
               var name = '';
               if (err != null) {
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
// JSON.stringify(dev.mac)
               var msg = {payload: data };
	       node.send(msg);
           });
       });

       b.deviceDiscoverTimerId = setInterval(function() {
            node.log('deviceDiscoverTime');
            b.discover();
       }, 60000);

       b.discover();

       return b;
    }

    function Broadlinkjs(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var global = this.context().global;
        var broadlink = global.get('broadlinkjs');

        var b = global.get('broadlink')|| createBroadlink(node, global, broadlink);

        this.on('close', function() {
            if (b != null && b.deviceDiscoverTimerId != null) {
                clearInterval(b.deviceDiscoverTimerId);    
                b.deviceDiscoverTimerId = null;
            }
            node.log('close');
        });
    }
    RED.nodes.registerType("broadlink_in", Broadlinkjs);

    RED.httpAdmin.get('/broadlinkjs/devices', function(req, res) {
        res.json(devices);
    });

    function BroadlinkConfig(n) {
        RED.nodes.createNode(this,n);
        this.device = n.device;

        var node = this;
    };
    RED.nodes.registerType('broadlink-dev', BroadlinkConfig);
}
