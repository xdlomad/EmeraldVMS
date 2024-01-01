const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3000;
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const qrCode_c = require('qrcode');
const { rateLimit } = require('express-rate-limit')
const { MongoClient, ServerApiVersion } = require('mongodb');

const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 15 minutes
	max: 5, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	message : "Too many requests from this IP, please try again after 5 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

const uri = process.env.mongo0bongo ;
//const credentials = process.env.mongocert;

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
//app.use(express.json())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
   res.redirect('/VMS')
})

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

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/VMS', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//login POST request
app.post('/login',limiter, async (req, res) => {
    let data = req.body
    let result = await login(data);
    const loginuser = result.verify
    const token = result.token
    //check the returned result if its a object, only then can we welcome the user
    if (typeof loginuser == "object") { 
      res.status(200).send(loginuser.user_id + " has logged in!\nWelcome "+ loginuser.name + "!\nYour token : " + token)
    }else {
      //else send the failure message
      res.status(400).send(errorMessage() + result)
    }
  });

//find user GET request
app.get('/finduser/:name', verifyToken, async (req, res)=>{
  let authorize = req.user.role //reading the token for authorisation
  let data = req.params.name //requesting the data from body
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
  //checking the role of user
    const newUser = await registerResident(data)
    if (newUser){ //checking is registration is succesful
      res.status(200).send("Registration request processed, please wait for admin approval " + newUser.name)
    }else{
      res.status(400).send(errorMessage() + "Approval Pending or User already exist")
    }
  //token does not exist
  })

//register user post request
app.post('/registerResident', async (req, res)=>{
  let data = req.body //requesting the data from body
  //checking the role of user
    const newUser = await registerResident(data)
    if (newUser){ //checking is registration is succesful
      res.status(200).send("Registration request processed, please wait for admin approval " + newUser.name)
    }else{
      res.status(400).send(errorMessage() + "Approval Pending or User already exist")
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
//update user PATCH request
app.patch('/updateuser', verifyToken, async (req, res)=>{
  let authorize = req.user.role //reading the token for authorisation
  let data = req.body //requesting the data from body
  //checking the role of user
  if (authorize == "security" || authorize == "resident"){
    res.status(404).send("you do not have access to update user information!")
  }else if (authorize == "admin" ){
    const result = await updateUser(data)
    if (result){ // checking if the user exist and updated
      res.status(200).send("User updated! " + result.name)
    }else{
      res.status(400).send(errorMessage() + "User does not exist!")
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
  let authorize = req.user.role
  let loginUser = req.user.user_id
  let data = req.body
  //checking if token is valid
  if(authorize){
  const visitorData = await registerVisitor(data, loginUser) //register visitor
    if (visitorData){
      re.status(200).send("Registration request processed, visitor is " + visitorData.name)
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
  console.log(data);
  if (authorize.role){
    const result = await findVisitor(data,authorize) //find visitor
    res.status(200).send(result)
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
app.get('/visitorPass/:IC_num', verifyToken, async (req, res)=>{
  let data = req.params.IC_num
  let authorize = req.user
  if (authorize.role){ //checking if token is valid
  const uri = await qrCreate(data) //create qr code
    if (uri){
      res.status(200).send("QR code created for visitor! Download your visitor pass now :D\n"+ uri)
    }else{
      res.status(404).send(errorMessage() + "No such visitor found")
    }
  }else {
      res.status(401).send(errorMessage() + "Not a valid token!")
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
    match = await user.find({name : newdata},{projection: {password: 0, _id : 0}}).next()
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

async function registerResident(newdata) {
  //verify if there is duplicate username in databse
  const match = await pending.find({user_id : newdata.user_id}).next()
  const match2 = await user.find({user_id : newdata.user_id}).next()
  if (match) {
      return 
    } else {
      if (match2){
        return
      }else{
      //encrypt password by hashing
      const hashed = await encryption(newdata.password)
      // add info into database
      await pending.insertOne({
        "user_id": newdata.user_id,
        "password": hashed,
        "name": newdata.name,
        "unit": newdata.unit,
        "hp_num" : newdata.hp_num,
        "role" : "resident"
      })
  const newUser=await pending.find({user_id : newdata.user_id}).next()
  return (newUser)
}
}}

async function updateUser(data) {
  if (data.password){
  data.password = await encryption(data.password) //encrypt the password
  }
  result = await user.findOneAndUpdate({user_id : data.user_id},{$set : data}, {new: true})
  if(result == null){ //check if user exist
    return 
  }else{
    return (result)
  }
}

async function deleteUser(data) {
  //delete user from database
  success = await user.deleteOne({user_id : data.user_id})
  return (success) // return success message
}

async function registerVisitor(newdata, currentUser) {
  //verify if there is duplciate ref_num
  const match = await visitor.find({"ref_num": newdata.ref}).next()
    if (match) {
      return 
    } else {
      // add info into database
      await visitor.insertOne({
        "ref_num" : newdata.ref,
        "name": newdata.name,
        "IC_num": newdata.IC_num,
        "car_num": newdata.car_num,
        "hp" : newdata.hp_num,
        "pass": newdata.pass,
        "category" : newdata.category,
        "visit_date" : newdata.date,
        "unit" : newdata.unit,
        "user_id" : currentUser
      })
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
  if (match != 0){ //check if there is any visitor
    return (match)
  } else{
    res.status() (errorMessage() + "Visitor does not exist!")
  }
}

async function updateVisitor(data, currentUser) {
  if (currentUser.role == "resident"|| currentUser.role == "security"){ //only allow resident and security to update their own visitors
    result = await visitor.findOneAndUpdate({"ref_num": data.ref_num, "user_id" : currentUser.user_id },{$set : data}, {new:true})
  }else if (currentUser.role == "admin"){
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
async function qrCreate(data){
  visitorData = await visitor.find({"IC_num" : data}, {projection : {"ref_num" : 1 , "name" : 1 , "category" : 1 , "user_id" : 1, _id : 0}}).next() //find visitor data
  if(visitorData){ //check if visitor exist
    userData = await user.find({"user_id" : visitorData.user_id}, {projection : {"hp_num" : 1 , "unit" : 1 , "_id" : 0}}).next() //find user data
    //add both hp_num and unit into visitor data
    visitorData["user_unit"] = userData.unit
    visitorData["user_hp"] = userData.hp_num //add user data into visitor data
    let stringdata = JSON.stringify(visitorData)
    const canvas = await qrCode_c.toString(stringdata) //convert to qr code to an image
    //const base64 = await qrCode_c.toDataURL(stringdata) //convert to qr code to data url
    return (canvas)
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
    res.status(401).send(errorMessage() + "Token is not found D:")
    return
  }
  let header = req.headers.authorization
  let token = header.split(' ')[1] //checking header //process.env.fuckyou
  jwt.verify(token,process.env.bigSecret,function(err,decoded){
    if(err) {
      res.status(401).send(errorMessage() + "Token is not valid D:, go to the counter to exchange (joke)")
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