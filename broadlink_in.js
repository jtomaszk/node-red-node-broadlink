module.exports = function(RED) {
    function createBroadlink(node, global, broadlink) {
       var b = new broadlink();
       global.set('broadlink', b);

       b.on("deviceReady", (dev) => {
           node.log(JSON.stringify(dev.host) + " " + JSON.stringify(dev.mac));

           dev.on("json", (data) => {
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
}
