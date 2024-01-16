//libraries export
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const bcrypt = require('bcrypt');
const saltRounds = 10;
const qrCode_c = require('qrcode');
const { rateLimit } = require('express-rate-limit')
const { MongoClient, ServerApiVersion } = require('mongodb');

require("dotenv").config();

//rate limiter to prevent brute force attack
const limiter = rateLimit({
	windowMs: 3 * 60 * 1000, // 15 minutes
	max: 5, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	message : "Too many requests from this IP, please try again after 5 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

//environment variables
const uri = process.env.mongo0bongo ;
//const credentials = '';

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true, 
    },
    //tlsCertificateKeyFile: credentials
  });

  

//start of port
client.connect() 

//variables to define which collection used
const user = client.db("EmeraldVMS").collection("users")
const visitor = client.db("EmeraldVMS").collection("visitors")
const visitorLog = client.db("EmeraldVMS").collection("visitor_log")
const pending = client.db("EmeraldVMS").collection("Pending_users")

//middleware to parse json with checking of json format
app.use(express.json(({
    verify : (req, res, buf, encoding) => {
      try {
        JSON.parse(buf);
      } catch(e) {
        res.status(415).send('request body format has an error. Missing a , or }');
        throw Error('invalid JSON');
      }
    }
  }
)))
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }) );


//redirect to main page
app.get('/', (req, res) => {
   res.redirect('/VMS')
})

//start of server
app.listen(port, () => {
   console.log(`Example app listening on port ${port}`)
})

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0', // Specify the OpenAPI version
    info: {
      title: 'Visitor Management System',
      version: '1.0.0',
      description: 'Visitor Management System using Swagger and Node.js',
    },
    components:{
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerformat: 'JWT',
        },
      },
    },
  },
  apis: ['./swagger.js'], // Path to your route files
};

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Setup swagger route
app.use('/VMS', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//login POST request
app.post('/login',limiter, async (req, res) => {
    let data = req.body
    toString(data)
    let result = await login(data);
    const loginuser = result.verify;
    const token = result.token;
    //check the returned result if its a object, only then can we welcome the user
    if (typeof loginuser == "object") { 
      if (loginuser.role == "admin"){
        let  j = result.hosts.length;
        const hosts = result.hosts;
        res.writeHead(200, {'Content-Type': 'text/plain'}); 
        res.write(loginuser.user_id + " has logged in!\nWelcome "+ loginuser.name + 
        "!\nYour token : " + token +"\n\nList of hosts : \n"  )
        for (i=0; i<j; i++){
        res.write(JSON.stringify(hosts[i],null,"\t") + "\n-----------------------------------\n" );
        }
        res.end("\n\nPlease proceed to the admin page to view the list of hosts")
      }else{
      res.status(200).send(loginuser.user_id + " has logged in!\nWelcome "+ loginuser.name +"!\nYour token : " + token)
      }
    }else {
      //else send the failure message
      res.status(400).send(errorMessage() + result)
    }
  });

//find user GET request
app.get('/finduser/:user_id', verifyToken, async (req, res)=>{
  let authorize = req.user.role //reading the token for authorisation
  let data = req.params.user_id //requesting the data from body
  //checking the role of user
  if (authorize == "resident"|| authorize == "security"){
    res.status(403).send(errorMessage() + "\nyou do not have access to finding users!")
  }else if (authorize == "admin"){
    const newUser = await findUser(data) //calling the function to find user
    if (newUser){ //checking if user exist
      res.status(200).send(newUser)
    }else{
      res.status(203).send(errorMessage() + "User does not exist sadly :[")
    }
  //token does not exist
  }else {
      res.status(401).send(errorMessage() + "Token not valid!")
    }
  })

//register user post request
app.post('/registeruser', verifyToken, async (req, res)=>{
  let authorize = req.user.role //reading the token for authorisation
  let data = req.body //requesting the data from body
  //checking the role of user
  if (authorize == "security" || authorize == "resident"){
    res.status(403).send("you do not have access to registering users!")
  }else if (authorize == "admin" ){
    const newUser = await registerUser(data)
    if (newUser){ //checking is registration is succesful
      res.status(200).send("Registration request processed, new user is " + newUser.name)
    }else{
      res.status(400).send(errorMessage() + "User already exist!")
    }
  //token does not exist
  }else {
      res.status(401).send(errorMessage() + "Token not valid!")
    }
  })

//register user post request
app.post('/test/registerResident', async (req, res)=>{
    let data = req.body //requesting the data from body
    let test = true
    toString(data)
    const [newUser, error] = await registerResident(data,test)
    if (newUser){ //checking is registration is succesful
      res.status(200).send("Test account approved \n" + "User ID: " + newUser.user_id + "\nHope you enjoy your stay " + newUser.name)
    }else{
      res.status(400).send(errorMessage() + error )
    }
  //token does not exist
  })

//register user post request
app.post('/registerResident', async (req, res) =>{
  let data = req.body //requesting the data from body
  //checking the role of user
    const [newUser, error] = await registerResident(data)
    if (newUser){ //checking is registration is succesful
      res.status(200).send("Registration request processed, please wait for admin approval\n Username: " + newUser.name)
    }else{
      res.status(400).send(errorMessage() + error)
    }
  //token does not exist
  })

  //register user post request
app.get('/checkPendings',verifyToken, async (req, res)=>{
  //checking the role of user
  let authorize = req.user.role //reading the token for authorisation
  if (authorize == "security" || authorize == "resident"){
    res.status(403).send("you do not have access to viewing pending request!")
  }else if (authorize == "admin" ){
    const pendingList = await pending.find().toArray();
    if (pendingList){ //checking is registration is succesful
      res.status(200).send(pendingList)
    }else { 
      res.status(400).send("No requests pending!")
    }
  //token does not exist
  }else{
    res.status(401).send(errorMessage() + "Token not valid!")
  }
})

  //register user post request
  app.get('/approvePending/:user_id',verifyToken, async (req, res)=>{
    //checking the role of user
    let authorize = req.user.role //reading the token for authorisation
    if (authorize == "security" || authorize == "resident"){
      res.status(403).send("you do not have access to viewing pending request!")
    }else if (authorize == "admin" ){
      const pendingUser = await pending.find({user_id : req.params.user_id}).next();
      if (pendingUser){ //checking is registration is succesful
        const newUser = await approveResident(pendingUser)
        await pending.deleteOne({user_id : req.params.user_id})
        res.status(200).send(newUser)
      }else { 
        res.status(400).send("No requests pending!")
      }
    //token does not exist
    }else{
      res.status(401).send(errorMessage() + "Token not valid!")
    }
  })


//update user PATCH request
app.patch('/updateuser', verifyToken, async (req, res)=>{
  let authorize = req.user.role //reading the token for authorisation
  let data = req.body //requesting the data from body
  //checking the role of user
  if (authorize == "security" || authorize == "resident"){
    res.status(404).send("you do not have access to update user information!")
  }else if (authorize == "admin" ){
    const result = await updateUser(data)
    if (typeof(result) == "object"){ // checking if the user exist and updated
      res.status(200).send("User updated! The new user info:\n" + JSON.stringify(result,null,'\t'))
    }else{
      res.status(400).send(errorMessage() + result)
    }
  }else {
      res.status(401).send(errorMessage() + "Token not valid")
    }
})


//delete user DELETE request
app.delete('/deleteuser', verifyToken, async (req, res)=>{
  let data = req.body
  let authorize = req.user.role
  //checking the role of user
  if (authorize == "security" || authorize == "resident"){
    res.status(403).send("you do not have access to registering users!")
  }else if (authorize == "admin" ){
    const result = await deleteUser(data)
    //checking if item is deleted
    if (result.deletedCount == "1"){
      res.send("user deleted " + data.user_id)
    }else{
      res.status(400).send(errorMessage() + "Cannot find the user to delete!")
    }
  }else {
      res.status(401).send(errorMessage() + "Token not valid!")
    }
  }
)

//register visitor POST request
app.post('/registervisitor', verifyToken, async (req, res)=>{
  let authorize = req.user
  let data = req.body
  //checking if token is valid
  if(authorize.role){
  const visitorData = await registerVisitor(data, authorize) //register visitor
    if (visitorData){
      res.status(200).send("Registration request processed, new visitor info: \n name : \n" + visitorData.name + "\n reference number : \n" + visitorData.ref_num )
    }else{
      res.status(400).send(errorMessage() + "Visitor already exists! Add a visit log instead!")
    }
  }else {
      res.status(401).send(errorMessage() + "Not a valid token!")
    }
  }
)

//find visitor GET request
app.get('/findvisitor/:ref_num', verifyToken, async (req, res)=>{
  let authorize = req.user//reading the token for authorisation
  let data = req.params.ref_num //requesting the data from body
  //checking the role of user
  if (authorize.role){
    const result = await findVisitor(data,authorize) //find visitor
    if(result)
    res.status(200).send(result)
    else{
      res.status(404).send(errorMessage() + "Visitor does not exist!")
    }
  }else{
    res.status(401).send(errorMessage() + "Not a valid token!") 
  }
  })


//update visitor PATCH request
app.patch('/updatevisitor', verifyToken, async (req, res)=>{
  let authorize = req.user
  let data = req.body
  //checking if token is valid
  if(authorize.role){
    const result = await updateVisitor(data,authorize) 
    console.log(result);// update visitor
    if (result){
      res.status(200).send("Visitor " + result.name + " has been updated :D!")
    }else{
      res.status(404).send(errorMessage() + "Visitor does not exist!")
    }
  }else {
      res.status(401).send(errorMessage() + "Not a valid token!")
    }
})


//delete visitor DELETE request
app.delete('/deletevisitor', verifyToken, async (req, res)=>{
  let data = req.body
  let authorize = req.user
  //checking if token is valid
  if(authorize.role){
  const deletedV = await deleteVisitor(data,authorize) //delete visitor
    if (deletedV.deletedCount == "1"){ //check for successful delete
      res.status(200).send("The visitor under reference number of " + data.ref_num + " has been deleted :D!")
    }else{
      res.status(404).send(errorMessage() + "No such visitor found D: , perhaps you actually wished your ex visited?")
    }
  }else {
      res.status(401).send(errorMessage() + "Not a valid token!")
    }
  }
)


//create a qr code for visitor
app.patch('/issuePass/:ref_num', verifyToken, async (req, res)=>{
  let data = req.params.ref_num
  let authorize = req.user
  toString(data)
  if (authorize.role){ //checking if token is valid
  const success = await approvePass(data, authorize) //create qr code
    if (success){
      res.status(200).send("ref num: " + success.ref_num + "\nvisitor is approved for a pass\n")
    }else{
      res.status(404).send(errorMessage() + "No such visitor found")
    }
  }else {
      res.status(401).send(errorMessage() + "Not a valid token!")
    }
  }
)

//create a qr code for visitor
app.get('/retrievePass/:IC_num', async (req, res)=>{
  let data = req.params.IC_num
  const uri = await qrCreate(data) //create qr code
  await new Promise(resolve => setTimeout(resolve, 3000));
    if (uri){
      res.status(200).send("Paste the uri in a new tab for your visitor pass now :D\n"+ uri)
    }else{
      res.status(404).send(errorMessage() + "No such visitor found or you have not been permitted for a pass")
    }
  }
)

//create a qr code for visitor
app.post('/verifyPass', verifyToken, async (req, res)=>{
  let data = req.body
  let authorize = req.user
  if (authorize.role == "security" || authorize.role == "admin"){ //checking if token is valid
  const [success, userHP] = await verifyPass(data, authorize) //create qr code
    if (success){
      res.status(200).send("visitor is legit. Visitor Info:\n "+ JSON.stringify(success) + "\n\nHost's Phone number:\n" + userHP.hp_num)
    }else{
      res.status(404).send(errorMessage() + "No such visitor found")
    }
  }else {
      res.status(401).send(errorMessage() + "Not a valid token! or you do not have access to verify passes")
    }
  }
)

//create a visitor log
app.post('/checkIn', verifyToken, async (req, res,err)=>{
  let data = req.body
  let authorize = req.user.role
  //checking role of users
  if (authorize == "security" || authorize == "admin")
  { //roles that can create visitor logs
    const logData = await createLog(data,req.user) //create logs
    if (logData){
      res.status(200).send({message : "Visitor Log Created!", logData})
    }else{
      res.status(400).send(errorMessage() + "Duplicate Log! Might wanna find the admin")
    }
  }else if (authorize == "resident" ){
    res.status(401).send(errorMessage() + "You do not have access to create visitor logs!")
  }else{
    res.status(401).send(errorMessage() + "token not valid D:")
    }
  })

//find visitor log
app.post('/findvisitorlog', verifyToken, async (req, res)=>{
    let authorize = req.user.role //reading the token for authorisation
    let data = req.body //requesting the data from body
    //checking the role of user
    if (authorize == "resident"){
      res.status(401).send(errorMessage() + "you do not have access to registering users!")
    }
    else if (authorize == "security" || authorize == "admin"){
      const result = await findLog(data) //find logs
      res.status(200).send(result)
    }
  }
  )

//update a visitor log to checkout visitor
app.patch('/checkOut', verifyToken, async (req, res)=>{
  let data = req.body
  let authorize = req.user.role
  if (authorize == "security" || authorize == "admin"){ //check roles that can update visitor logs
    const logData = await updateLog(data)
    if (typeof logData == "object"){ //if returned data is object, means log is updated
      res.status(200).send( "Visitor succesfully checkout")
    }else{
      res.status(400).send(errorMessage() + "Could not find log :[")
    }
  }else if (authorize == "resident" ){
    res.send("You do not have access to update visitor logs!")
  }else{
    res.status(400).send(errorMessage() + "Please enter a valid role!")
    }
  })


async function login(data) {
  console.log("Alert! Alert! Someone is logging in!") //Display message to ensure function is called
  //Verify username is in the database
  let verify = await user.find({user_id : data.user_id}).next();
  if (verify){
    //verify password is correct
    const correctPassword = await bcrypt.compare(data.password,verify.password);
    if (correctPassword){
      token = generateToken(verify)
      if (verify.role == "admin"){
        console.log("Admin has logged in!")
        hosts = await user.find({role : "resident"}, {projection: {_id :0  , password : 0}}).toArray();
        return{verify,token,hosts};
      }
      return{verify,token};
    }else{
      return ("Wrong password D: Forgotten your password?")
    }
  }else{
    return ("No such user ID found D:")
}}

async function findUser(newdata) {
  //verify if there is duplicate username in databse
  if (newdata == ","){
    match = await user.find({}, {projection: {password: 0, _id : 0}}).toArray()
  }else{
    match = await user.find({user_id : newdata},{projection: {password: 0, _id : 0}}).next()
  }
  return (match)
}

async function registerUser(newdata) {
  //verify if there is duplicate username in databse
  const match = await user.find({user_id : newdata.user_id}).next()
    if (match) {
      return 
    } else {
      //encrypt password by hashing
      const hashed = await encryption(newdata.password)
      // add info into database
      await user.insertOne({
        "user_id": newdata.user_id,
        "password": hashed,
        "name": newdata.name,
        "unit": newdata.unit,
        "hp_num" : newdata.hp_num,
        "role" : newdata.role
      })
  const newUser=await user.find({user_id : newdata.user_id}).next()
  return (newUser)
}}

async function registerResident(newdata,test) {
  //verify if there is duplicate username in databse
  const match = await pending.find({ $or: [ { user_id : newdata.user_id }, {unit : newdata.unit} ] }).next()
  const match2 = await user.find({ $or: [ { user_id : newdata.user_id }, {unit : newdata.unit} ] }).next()
  if (match) {
    return [null, "User registration already pending or user already exist!"]
  }else if (match2){
      return [null, "User already exist!"]
    } else {
      if (CheckPassword(newdata.password) == false){
        error = "Password must be between 5 to 15 characters which contain at least one numeric digit and a special character"
        return [null, error]
      }
        let hashed = await encryption(newdata.password)
        let insert = {
          "user_id": newdata.user_id,
          "password": hashed,
          "name": newdata.name,
          "unit": newdata.unit,
          "hp_num" : newdata.hp_num,
          "role" : "resident" }
        if (test == true)
        {
          await user.insertOne(insert)
          newUser=await user.find({user_id : newdata.user_id}).next()
        }else{
          await pending.insertOne(insert)
          newUser=await pending.find({user_id : newdata.user_id}).next()
        }
        return [newUser, null]
      }
    }

    async function registerResident(newdata) {
      //verify if there is duplicate username in databse
      const match = await pending.find({ $or: [ { user_id : newdata.user_id }, {unit : newdata.unit} ] }).next()
      const match2 = await user.find({ $or: [ { user_id : newdata.user_id }, {unit : newdata.unit} ] }).next()
      if (match) {
        return [null, "User registration already pending or user already exist!"]
      }else if (match2){
          return [null, "User already exist!"]
        } else {
          if (CheckPassword(newdata.password) == false){
            error = "Password must be between 5 to 15 characters which contain at least one numeric digit and a special character"
            return [null, error]
          }
            let hashed = await encryption(newdata.password)
            let insert = {
              "user_id": newdata.user_id,
              "password": hashed,
              "name": newdata.name,
              "unit": newdata.unit,
              "hp_num" : newdata.hp_num,
              "role" : "resident" }
            if (test == true)
            {
              await user.insertOne(insert)
              newUser=await user.find({user_id : newdata.user_id}).next()
            }else{
              await pending.insertOne(insert)
              newUser=await pending.find({user_id : newdata.user_id}).next()
            }
            return [newUser, null]
          }
        }

async function updateUser(data) {
  if (data.password){
  data.password = await encryption(data.password) //encrypt the password
  }
  amAdmin = await user.find({user_id : data.user_id}).next()
  if (amAdmin == null){
    return ("User does not exist")
  }else if (amAdmin.role == "admin"){
    return ("Admin cannot be updated!")
  }else{
    result = await user.findOneAndUpdate({user_id : data.user_id},{$set : data}, {new: true})
    if(result == null){ //check if user exist
      return ("User does not exist!")
    }else{
      return (result)
    }
}
}

async function deleteUser(data) {
  //delete user from database
  success = await user.deleteOne({user_id : data.user_id})
  return (success) // return success message
}

async function registerVisitor(newdata, currentUser) {
  //verify if there is duplciate ref_num
  const match = await visitor.find({"ref_num": newdata.ref_num}).next()
    if (match) {
      return 
    } else {
      if (currentUser.role == "resident"){
      // add info into database
      await visitor.insertOne({
        "ref_num" : newdata.ref_num,
        "name": newdata.name,
        "IC_num": newdata.IC_num,
        "car_num": newdata.car_num,
        "hp" : newdata.hp_num,
        "pass": false,
        "category" : newdata.category,
        "visit_date" : newdata.visit_date,
        "unit" : currentUser.unit,
        "user_id" : currentUser.user_id
      })
    }else if (currentUser.role == "security" || currentUser.role == "admin"){
      // add info into database
      await visitor.insertOne({
        "ref_num" : newdata.ref_num,
        "name": newdata.name,
        "IC_num": newdata.IC_num,
        "car_num": newdata.car_num,
        "hp" : newdata.hp_num,
        "pass": false,
        "category" : newdata.category,
        "visit_date" : newdata.visit_date,
        "unit" : newdata.unit,
        "user_id" : currentUser.user_id
      })
    }
          return (newdata)
    }  
}

async function findVisitor(newdata, currentUser){
  if (currentUser.role == "resident"){
    if (newdata == ","){ // only allow resident to find their own visitors
     match = await visitor.find({}, {"user_id" : currentUser.user_id}, {projection: {_id :0}}).toArray()
    }else{
      match = await visitor.find({"ref_num" : newdata}, {"user_id" : currentUser.user_id}, {projection: {_id :0}}).toArray()
    }
  }else if (currentUser.role == "security" || currentUser.role == "admin"){ // allow security and admin to find all visitors
    if (newdata == ","){
    match = await visitor.find({}, {projection: {_id :0}}).toArray()
    }else{
    match = await visitor.find({"ref_num":newdata}).next()
    }
  }
    return (match)
}

async function updateVisitor(data, currentUser) {
  data["pass"] = false
  if (currentUser.role == "resident"){ //only allow resident to update their own visitors
    result = await visitor.findOneAndUpdate({"ref_num": data.ref_num, "user_id" : currentUser.user_id,"unit": currentUser.unit},{$set : data}, {new:true})
  }else if (currentUser.role == "admin"|| currentUser.role == "security"){
    result = await visitor.findOneAndUpdate({"ref_num": data.ref_num},{$set : data}, {new:true}) //allow admin to update all visitors
  }
  if(result== null){ //check if visitor exist
    return 
  }else{
    return (result)
  }
}

async function deleteVisitor(newdata, currentUser) {
  if (currentUser.role == "resident"|| currentUser.role == "security"){ //only allow resident and security to delete their own visitors
    success  = await visitor.deleteOne({ref_num : newdata.ref_num, user_id : currentUser.user_id})
  }else if (currentUser.role == "admin"){ //allow admin to delete all visitors
    success  = await visitor.deleteOne({ref_num : newdata.ref_num})
  }
  return (success) // return success message
}

async function createLog(newdata,currentUser) {
  //verify if there is duplicate log id
  const match = await visitorLog.find({"log_id": newdata.log_id}).next()
    if (match) {
      return 
    } else {
      // add info into database
      let dateTime = currentTime()
      await visitorLog.insertOne({
        "log_id": newdata.log_id,
        "ref_num" : newdata.ref,
        "CheckIn_Time": dateTime,
        "CheckOut_Time": "",
        "user_id" : currentUser.user_id
      })
  const log = visitorLog.find({"log_id": newdata.log_id}, {projection :{_id : 0 }}).next()
    return (log)
    }  
}

async function updateLog(newdata) {
  //verify if username is already in databse
  let dateTime = currentTime()
  const newLog = await visitorLog.findOneAndUpdate({"log_id": newdata.log_id},{$set : {CheckOut_Time: dateTime}}) //update the checkout time
    if (newLog == null) { //check if log exist
      return 
    } else {
        return (newLog)
    }  
}

//function to create qrcode file
async function approvePass(data, currentUser){
  if (currentUser.role == "resident"){ 
    result = await visitor.findOneAndUpdate({"ref_num": data, user_id : currentUser.user_id},{$set : {pass : true}}, {new:true})
  }else if (currentUser.role == "admin"|| currentUser.role == "security"){
    result = await visitor.findOneAndUpdate({"ref_num": data},{$set : {pass : true}}, {new:true}) //allow admin to update all visitors
  }
  if(result== null){ //check if visitor exist
    return 
  }else{
    return (result)
  }
}

async function verifyPass(data, currentUser){
  let verify = await visitor.find({"unit": data.unit},{projection : { "_id": 0 }} ).toArray();
  if(verify){
    for (i=0; i<verify.length; i++){
    const correct = await bcrypt.compare(verify[i].ref_num,data.ref_num);
    if (correct){
      let required = await user.find({"user_id": verify[i].user_id},{projection : { "_id": 0 }} ).next();
      return [verify[i], required]
    }
  }
  }else {
    return
  }
}

//function to create qrcode file
async function qrCreate(data){
  visitorData = await visitor.find({"IC_num" : data}, {projection : {"ref_num" : 1, "unit" : 1 , "pass" : 1, "_id": 0 }}).next() //find visitor data
  if(visitorData.pass == true){ //check if visitor exist
    let hashed = await encryption(visitorData.ref_num)
    let stringdata = {ref_num : hashed, unit : visitorData.unit}
    stringdata = JSON.stringify(stringdata)
    //const canvas = await qrCode_c.toString(stringdata) //convert to qr code to an image
    const base64 = await qrCode_c.toDataURL(stringdata) //convert to qr code to data url
    return (base64)
  }else{
    return
  }
}

//find visitor logs
async function findLog(newdata){
  const match = await visitorLog.find(newdata, {projection: {"_id":0}}).toArray() //find logs
  if (match.length != 0){   //check if there is any log
    return (match) 
  } else{
    return (errorMessage() + "Visitor log does not exist !")
  }
}

// to get the current time 
function currentTime(){
  const today = new Date().toLocaleString("en-US", {timeZone: "singapore"}) 
  return today
}

//generate token for login authentication
function generateToken(loginProfile){
  return jwt.sign(loginProfile, process.env.bigSecret , { expiresIn: '1h' });
}

//verify generated tokens
function verifyToken(req, res, next){
  if (!req.headers.authorization)
  {
    res.status(401).send(errorMessage() + "Token is not found D: , please login")
    return
  }
  let header = req.headers.authorization
  let token = header.split(' ')[1] //checking header //process.env.fuckyou
  jwt.verify(token,process.env.bigSecret,function(err,decoded){
    if(err) {
      res.status(401).send(errorMessage() + "Token is not valid D:, go to the counter to exchange (joke) , just login again")
      return
    }
    req.user = decoded // bar

    next()
  });
}

//bcrypt functions to generate a hashed password
async function encryption(data){
  const salt= await bcrypt.genSalt(saltRounds)
  const hashh = await bcrypt.hash(data,salt)
  return hashh
}

async function toString(o) {
  Object.keys(o).forEach(k => {
    if (typeof o[k] === 'object') {
      return toString(o[k]);
    }
    
    o[k] = '' + o[k];
  });
  
  return o;
}

//error message generator
function errorMessage(){
  const x = Math.floor(Math.random()*6)
  if (x == 0){
    return ("Oopsie Daisy\n")
  }else if (x == 1){
    return ("Error! Error! Error!\n")
  }else if (x==2){
    return ("I can accept failure. Everyone fails at something. But I can't accept not trying. ― Michael Jordan\n")
  }else if (x==3){
    return ("Waoh how did you even get an error here?\n")
  }else if (x==4){
    return ("Something went wrong! FeelsBadMan\n")
  }else if (x==5){
    return ("Hi, I'm Error Man , I'm here to tell you\n")
  }else{
    return ("Oi bo- Sir/Madam, we seem to have an error\n")
  }
}

function CheckPassword(inputtxt) 
{ 
var paswd=  /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{5,15}$/;
if(inputtxt.match(paswd)) 
{ 
return true
}
else
{ 
return false
}
}  