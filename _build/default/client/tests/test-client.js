// this file shamelessly stolen from the Nightmare GitHub page
var Nightmare = require('nightmare');
var expect = require('chai').expect; // jshint ignore:line

console.log("PATH = \"" + process.env.path + "\"");

describe('test account creation', function() {
    this.timeout('30s');
    var nightmare = Nightmare();

    it('try to make an account first', function(done) {
        nightmare
            .goto('http://localhost:8080/index.html')
            .click('body > div.topright > div.userButtons:nth-child(1) > a')
            .type('div.signup-container input[name="username"]', 'someUser')
            .type('div.signup-container input[name="password1"]', 'somePassword')
            .type('div.signup-container input[name="password2"]', 'somePassword')
            .click('div.signup-container input[type="submit"]')
            .wait(2000)
            .end()
            .then(result => {done()})
            .catch(done);
    });
});
