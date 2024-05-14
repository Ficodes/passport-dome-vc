const passport = require('passport');
const Strategy = require('./lib/passport-vc').Strategy;


const params = {
    verifierTokenURL: '', // URL of the verifier
    verifierJWKSURL: '', // URL of the JWKS in the verifier
    redirectURI: '', // Callback URK in the current app, the one to be called by the verifier
    allowedRoles: [] // Legacy, this was used with the FIWARE Legal Person VC, with the LEAR it is not used
}
// Build the passport strategy
const strategy = new Strategy(params, (accessToken, refreshToken, profile, done) => {

    // This callback is called when the login is completed, access token includes
    // the raw credential and profile the user profile build from the credential
    done(null, profile)
});


// Enable express
const app = express();

// Configure passport
passport.use('siop', strategy);

// Configure the callback URL endpoint, this is the one called by the verifier
// The passport authenticate is included as a middleware
// This will execute the authenticate method in the strategy
app.get('/auth/siop/callback', 
    passport.authenticate('siop'),

function(req, res) {
    res.send('ok');
});

// This method allows the frontend to check the status of the login process
// using the state string, so it can redirect the website with a proper
// user session
app.get('/poll', (req, res, next) => {

    const encodedState = req.query.state
    passport.authenticate(config.siop.provider, { poll: true, state: encodedState })(req, res, next);
});


// Some frontend need to be served, such a frontend should show
// the verifier window showing the QR code and adding the state
// and the callback URL
app.get(`/login/`, (req, res) => {
    // Use a unique uuid for encoding the state, so we dont have collisions
    // between users using the SIOP authentication
    const encodedState = uuidv4();

    res.render("siop.jade",  {
        title: 'VC Login',
        verifierQRCodeURL: config.siop.verifierHost + config.siop.verifierQRCodePath,
        statePair: `state=${encodedState}`,
        callbackURLPair: `client_callback=${config.siop.callbackURL}`,
        clientIDPair: `client_id=${config.siop.clientID}`,
        pollURL: config.siop.pollPath
    });
});