var usps = require('../lib/usps')('381MRDAV8071');

for (var key in usps) {
    console.log(key);
}

usps.cityStateLookup('20500', function (err, loc) {
    if (err) console.log(err);
    console.log(loc);
});