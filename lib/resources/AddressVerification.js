module.exports.init = function (USPS) {

    function toTitleCase(str) {
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    USPS.prototype.verifyAddress = function (shippingAddress, cb) {

        if (shippingAddress.country !== 'United States') {
            return cb('Verify Address only accepts domestic addresses.');
        }

        var s = {};

        // create a cloned object
        for (var key in shippingAddress) {
            var value = shippingAddress[key];

            if (key === 'address_1' || key ===  'address_2') {
                value = value.replace('#', 'apt ');
            }

            value = value.replace(/[^a-zA-Z0-9 ]/, '');
            s[key] = value;
        }

        var url = ['http://production.shippingapis.com/ShippingAPITest.dll?API=Verify&XML=',
            '<AddressValidateRequest USERID="' + this.userId + '">',
                '<Address ID="0">',
                    '<FirmName></FirmName>',
                    '<Address1>' + s.address_2 + '</Address1>',
                    '<Address2>' + s.address_1 + '</Address2>',
                    '<City>' + s.city + '</City>',
                    '<State>' + s.state + '</State>',
                    '<Zip5>' + s.zip + '</Zip5>',
                    '<Zip4></Zip4>',
                '</Address>',
            '</AddressValidateRequest>'].join('');

        this._request(url, function (err, json) {
            if (err) return cb(err);
            var info;
            try {
                if (json.AddressValidateResponse.Address[0].ReturnText) {
                    info = {
                        error: json.AddressValidateResponse.Address[0].ReturnText[0]
                    };
                    cb(null, info);
                } else if (json.AddressValidateResponse.Address[0].Error) {
                    // invalid address or something
                    info = {
                        error: json.AddressValidateResponse.Address[0].Error[0].Description[0]
                    };
                    cb(null, info);
                } else {
                    // normal address selection
                    console.log('normal');
                    console.log(JSON.stringify(json, null, 2));

                    var a = json.AddressValidateResponse.Address[0];

                    info = {
                        address: {
                            address_1: a.Address2[0],
                            city: a.City[0],
                            state: a.State[0],
                            zip: a.Zip5[0],
                            zip4: a.Zip4[0]
                        }
                    };

                    if (a.Address1) {
                        info.address.address_2 = a.Address1[0];
                    }

                    cb(null, info);
                }
            } catch (e) {
                cb(e);
            }
        });
    };
};