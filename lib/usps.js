var request = require('request');
var parseString = require('xml2js').parseString;

function USPS(userId) {
    if (!(this instanceof USPS)) {
        return new USPS(userId);
    }

    this.userId = userId;
}

// used by each function so that we don't have to write xml parse code
// on every endpoint
// returns the ugly json blob or an error
USPS.prototype._request = function (url, cb) {
    request({
        url: encodeURI(url)
    }, function (err, response, xml) {
        if (err) return cb(err);

        // replace trademark html entities with utf-8 chars
        xml = xml.replace(new RegExp('&lt;sup&gt;&amp;reg;&lt;/sup&gt;', 'g'), '®');
        xml = xml.replace(new RegExp('&lt;sup&gt;&#174;&lt;/sup&gt;', 'g'), '®');
        xml = xml.replace(new RegExp('&amp;lt;sup&amp;gt;&amp;#174;&amp;lt;/sup&amp;gt;', 'g'), '®');
        xml = xml.replace(new RegExp('&lt;sup&gt;&amp;trade;&lt;/sup&gt;', 'g'), '™');
        xml = xml.replace(new RegExp('&lt;sup&gt;&#8482;&lt;/sup&gt;', 'g'), '™');
        xml = xml.replace(new RegExp('&amp;lt;sup&amp;gt;&amp;#8482;&amp;lt;/sup&amp;gt;', 'g'), '™');
        xml = xml.replace(/\*/g, '');


        console.log(xml);

        parseString(xml, function (err, json) {
            if (err) return cb(err);

            cb(null, json);
        });
    });
};

console.log('initializing Tracking module');
require('./resources/Tracking').init(USPS);
require('./resources/Commitment').init(USPS);
require('./resources/Calculator').init(USPS);
require('./resources/AddressVerification').init(USPS);

module.exports = USPS;