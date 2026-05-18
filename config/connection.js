

const mysql = require('mysql');
const state = {
    db: null
};

module.exports.connect = function(done) {
    const config = {
        host: 'localhost',  // Your MySQL host (usually 'localhost')
        user: 'root',  // Your MySQL username
        password: '',  // Your MySQL password
        database: 'shopping'  // Your database name
    };

    // Create MySQL connection
    state.db = mysql.createConnection(config);

    // Establish the connection
    state.db.connect((err) => {
        if (err) {
            console.log('Error connecting to MySQL:', err);
            return done(err);  // Return the error
        } else {
            console.log('Connected to the MySQL database');
            return done();  // No error, connection successful
        }
    });
};

// Function to get the connection
module.exports.get = function() {
    return state.db;  // Return the connection object
};







