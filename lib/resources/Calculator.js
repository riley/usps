var _ = require('underscore');

module.exports.init = function (USPS) {

    var uspsShippingOptions = {
        'domestic': {
            'express': {
                usps: 'EXPRESS',
                rileyLife: 'Express Mail'
            },
            'priority': {
                usps: 'PRIORITY',
                rileyLife: 'Priority Mail'
            },
            'firstClass': {
                usps: 'FIRST CLASS',
                rileyLife: 'First Class Mail'
            }
        }
    };

    function decimal2Pounds(weight) {
        console.log('weight: ', weight);
        var imperial = {
            pounds: Math.floor(weight)
        };

        if (weight < 1) {
            imperial.ounces = Math.ceil(weight * 16);
        } else {
            imperial.ounces = Math.ceil(weight % Math.floor(weight) * 16);
        }

        return imperial;
    }

    /* returns the cheapest international shipping rate */

    USPS.prototype.calculateIntlShipping = function (weight, subtotal, country, cb) {
        var imperial = decimal2Pounds(weight);
        var url = ['http://production.shippingapis.com/ShippingAPI.dll?API=IntlRateV2&XML=<IntlRateV2Request USERID="' + this.userId + '"><Revision>2</Revision>',
            '<Package ID="1">',
                '<Pounds>' + imperial.pounds + '</Pounds>',
                '<Ounces>' + imperial.ounces + '</Ounces>',
                '<Machinable>True</Machinable>',
                '<MailType>Package</MailType>',
                '<ValueOfContents>' + (subtotal / 100).toFixed(2) + '</ValueOfContents>',
                '<Country>' + country + '</Country>',
                '<Container>RECTANGULAR</Container>',
                '<Size>LARGE</Size>', // any package dimension is larger than 12"
                '<Width>15</Width>', // default dimensions until we know for sure.
                '<Length>12</Length>',
                '<Height>6</Height>',
                '<Girth></Girth>',
                '<CommercialFlag>y</CommercialFlag>',
             '</Package></IntlRateV2Request>'].join('');

        this._request(url, function (err, json) {
            if (err) return cb(err);

            console.log(JSON.stringify(json, null, 2));

            console.log('--------------------------------');

            var services = json.IntlRateV2Response.Package[0].Service.map(function (service) {
                var s = {
                    pounds: parseInt(service.Pounds[0], 10),
                    ounces: parseInt(service.Ounces[0], 10),
                    description: service.SvcDescription[0]
                };

                if (service.CommercialPostage) {
                    s.rate = Math.floor(parseFloat(service.CommercialPostage[0], 10) * 100);
                } else {
                    s.rate = Math.floor(parseFloat(service.Postage[0], 10) * 100);
                }

                return s;
            });

            // remove GXG services
            services = _.reject(services, function (svc) {
                return !!svc.description.match(/GXG/);
            });

            services = _.sortBy(services, function (svc) {
                return svc.rate;
            });

            var info = {
                cheapest: services[0],
                services: services
            };

            cb(null, info);
        });
    };

    /*

    get domestic shipping rates IN PENNIES

    service must be "FIRST CLASS", "PRIORITY", or "EXPRESS"

    */

    USPS.prototype.calculateDomesticShipping = function (weight, service, zip, cb) {
        var imperial = decimal2Pounds(weight);

        console.log(arguments);

        var url = 'http://production.shippingapis.com/ShippingAPI.dll?API=RateV4&XML=<RateV4Request USERID="' + this.userId  + '" ><Revision/>' +
                '<Package ID="1">' +
                    '<Service>' + service + '</Service>' +
                    ((service === 'FIRST CLASS') ? '<FirstClassMailType>PARCEL</FirstClassMailType>' : '') +
                    '<ZipOrigination>27604</ZipOrigination>' + // north carolina
                    '<ZipDestination>' + zip + '</ZipDestination>' +
                    '<Pounds>' + imperial.pounds + '</Pounds>' +
                    '<Ounces>' + imperial.ounces + '</Ounces>' +
                    '<Container>RECTANGULAR</Container>' +
                    '<Size>LARGE</Size>' + // any package dimension is larger than 12"
                    '<Width>15</Width>' + // default dimensions until we know for sure.
                    '<Length>12</Length>' +
                    '<Height>6</Height>' +
                '</Package>' +
            '</RateV4Request>';

        this._request(url, function (err, json) {
            if (err) return cb(err);

            console.log(JSON.stringify(json, null, 2));

            if (json.RateV4Response.Package[0].Error) {
                return cb(null, {error: json.RateV4Response.Package[0].Error[0].Description[0]});
            }

            try { // normal return
                var pkg = json.RateV4Response.Package[0];
                var info = {
                    origin: pkg.ZipOrigination[0],
                    destination: pkg.ZipDestination[0],
                    pounds: parseInt(pkg.Pounds[0], 10),
                    ounces: parseInt(pkg.Ounces[0], 10),
                    size: pkg.Size[0],
                    zone: pkg.Zone[0],
                    postage: {
                        service: pkg.Postage[0].MailService[0],
                        rate: Math.floor(parseFloat(pkg.Postage[0].Rate[0], 10) * 100)
                    }
                };
                cb(null, info);
            } catch (e) {
                throw e;
            }
        });
    };
};