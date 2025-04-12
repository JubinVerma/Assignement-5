const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

let Schema = mongoose.Schema;


let userSchema = new Schema({
    userName: {
        type: String,
        unique: true
    },
    password: String,
    email: String,
    loginHistory: [
        {
            dateTime: Date,
            userAgent: String
        }
    ]
});

// defined on initialize
let User;

function initialize() {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(process.env.MONGODB);
        db.on('error', (err)=>{
        reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
        User = db.model("users", userSchema);
        resolve();
        });
    });
}

function registerUser(userData) {
    return new Promise(function(resolve, reject) {
        if(userData.password !== userData.password2) {
            reject("Passwords do not match");
        } else 
        {
            // encrypt password
        bcrypt.hash(userData.password, 10).then(hash=>{ 
                userData.password = hash;

                let newUser = new User(userData);

                newUser.save()
                .then(() => { resolve(); })
                .catch((err) =>
                {
                    err.code == 11000 ? reject("User Name already taken") : reject(
                        (`There was an error creating the user: ${err}`, err))
                })
                })

            .catch(err=>{
            return reject("There was an error encrypting the password");
            });

            
        }
    })
}

function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.find({userName:userData.userName}).exec()
        .then((users) => {
            if (users[0].length == 0) 
            {
                reject("Unable to find user: " + userData.userName);
            } 
            
            bcrypt.compare(userData.password, userData.password).then((result) => 
                {
                    if (result == false) {
                        reject("Incorrect Password for user: " + userData.userName);
                    }
                });

                // check for logging space
            {
            if(users[0].loginHistory.length == 8){
                users[0].loginHistory.pop()
            }

            users[0].loginHistory.unshift({dateTime: (new Date()).toString(), userAgent: userData.userAgent});

            User.updateOne({
                userName:users[0].userName, 
                $set: {
                    loginHistory: users[0].loginHistory
                }
            }).exec()
            .then(resolve(users[0]))
            .catch((err)=> {reject("There was an error verifying the user: " + err)});
            }

        })
        .catch(() => reject("Unable to find user: " + userData.userName));

    })
}


module.exports = {
    initialize,
    registerUser,
    checkUser
}

