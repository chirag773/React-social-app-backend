const express           = require('express');
const app               = express();
const bodyParser        = require('body-parser');
const mongoose          = require('mongoose');
const passport          = require("passport");

// files 
const users = require("./routes/api/users");
const profile = require("./routes/api/profile");
const posts = require("./routes/api/posts");

const db = require("./config/keys").mongoURI;

//connect to database 

mongoose.connect(db)
.then(()=> console.log("mongoDB started connect to local database"))
.catch((err)=>console.log(err))

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json())


//passport Initialize
app.use(passport.initialize());

require("./config/passport")(passport);

app.use("/api/users", users);
app.use("/api/posts", posts);
app.use("/api/profile", profile);


const port = process.env.PORT || 5000;

app.listen(port, function () {
  console.log(`Server started at port ${port}`);
});