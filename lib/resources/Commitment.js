module.exports.init = function (USPS) {

    // https://www.usps.com/business/web-tools-apis/domestic-mail-service-standards-api.htm

    var warehouseZip = '27604';

    function buildCommitment(service, destinationZip) {
        console.log('buildCommitment', service, destinationZip);

        if (service === 'First Class Mail') {
            return ['http://production.shippingapis.com/ShippingAPI.dll?API=FirstClassMail&XML=',
                '<FirstClassMailRequest USERID="381MRDAV8071">',
                    '<OriginZip>' + warehouseZip.substring(0, 3) + '</OriginZip>',
                    '<DestinationZip>' + destinationZip.substring(0, 3) + '</DestinationZip>',
                '</FirstClassMailRequest>'
            ].join('');
        } else if (service === 'Priority Mail') {
            return ['http://production.shippingapis.com/ShippingAPI.dll?API=PriorityMail&XML=',
                '<PriorityMailRequest USERID="381MRDAV8071">',
                    '<OriginZip>' + warehouseZip.substring(0, 3) + '</OriginZip>',
                    '<DestinationZip>' + destinationZip.substring(0, 3) + '</DestinationZip>',
                '</PriorityMailRequest>'
            ].join('');
        } else if (service === 'Express Mail') {
            return ['http://production.shippingapis.com/ShippingAPI.dll?API=ExpressMailCommitment&XML=',
                '<ExpressMailCommitmentRequest USERID="381MRDAV8071">',
                    '<OriginZIP>' + warehouseZip + '</OriginZIP>',
                    '<DestinationZIP>' + destinationZip + '</DestinationZIP>',
                    '<Date></Date>',
                '</ExpressMailCommitmentRequest>'
            ].join('');
        } else {
            return undefined;
        }
    }

    /*

    get estimated delivery time from USPS

    service: First Class Mail | Priority Mail | Express Mail

    returns: {
        eta: Number (days),
        destinationZip: String,
        originZip: String (warehouse)
    }

    */

    USPS.prototype.commitment = function (service, destinationZip, cb) {

        var url = buildCommitment(service, destinationZip);

        var commitmentData = {};

        this._request(url, function (err, json) {
            console.log(json);
            try {
                if (service === 'First Class Mail') {
                    commitmentData = {
                        eta: parseInt(json.FirstClassMailResponse.Days[0], 10),
                        destinationZip: destinationZip,
                        originZip: warehouseZip
                    };
                } else if (service === 'Priority Mail') {
                    commitmentData = {
                        eta: parseInt(json.PriorityMailResponse.Days[0], 10),
                        destinationZip: destinationZip,
                        originZip: warehouseZip
                    };
                } else if (service === 'Express Mail') {
                    commitmentData = {
                        eta: parseInt(json.ExpressMailCommitmentResponse.Commitment[0].CommitmentName[0], 10),
                        destinationZip: destinationZip,
                        originZip: warehouseZip
                    };
                } else {
                    throw "You must have a valid usps service defined";
                }
            } catch (e) {
                commitmentData = {
                    eta: undefined,
                    destinationZip: destinationZip,
                    originZip: warehouseZip
                };
            }

            cb(null, commitmentData);
        });
    };
};