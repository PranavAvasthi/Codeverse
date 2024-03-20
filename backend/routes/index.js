var express = require('express');
var router = express.Router();
const db = require('../models');
const multer = require('multer');   
const uploader = multer ({dest : 'uploads'});
const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');

const {checkLogin, createUser, updateUser} = require('../service/userService');
const {hashPass} = require('../service/bcryptService');
const {comparePass} = require('../service/bcryptService');

db.sequelize.sync();

const modelPath = path.join(__dirname, '../predicted_masks.h5');

let model;

async function loadModel() {
    try {
        model = await tf.loadLayersModel( modelPath);
        console.log('Model loaded successfully');
    } catch (error) {
        console.error('Error loading model:', error);
    }
}

loadModel();

router.post('/upload-image', uploader.single('pic'), async (req, res) => {
    if (!model) {
        return res.status(500).send('Model not loaded');
    }

    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const product = await db.product.create({
            title: req.body.prodT,
            description: req.body.prodD,
            pic: req.file.path
        });

        const imageData = fs.readFileSync(req.file.path);
        const imageTensor = tf.node.decodeImage(imageData);

        const processedImageTensor = model.predict(imageTensor);
        const processedImageData = await tf.node.encodePng(processedImageTensor);

        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(Buffer.from(processedImageData));

        fs.unlinkSync(req.file.path);
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).send('Error processing image');
    }
});

// // Route handler to handle form submission for product details
router.post('/create-product', uploader.single('pic'), async (req, res) => {
    try {
        // Check if all required fields are present
        if (!req.body.prodT || !req.body.prodD || !req.file) {
            return res.status(400).send('Missing required fields');
        }

        // Create the product in the database
        const product = await db.product.create({
            title: req.body.prodT,
            description: req.body.prodD,
            pic: req.file.path // Assuming multer saves the file path to req.file.path
        });

        // res.redirect('/'); // Redirect to home page or wherever appropriate
    } catch (error) {
        console.error('Error uploading product:', error);
        res.status(500).send('Error uploading product');
    }
});

// const modelPath = path.join(__dirname, 'predicted_masks.h5');
// const modelPath = 'file:///Users/kunalbansal/Desktop/Smart-Catalogue-Hackathon/backend/output.json';

// let model;

// async function loadModel() {
//     try {
//         model = await tf.loadLayersModel(modelPath);
//         console.log('Model loaded successfully');
//     } catch (error) {
//         console.error('Error loading model:', error);
//     }
// }

// loadModel();

// Route handler to handle form submission for uploading product details
// router.post('/create-product', uploader.single('pic'), async (req, res) => {
//     try {
//         // Check if all required fields are present
//         if (!req.body.prodT || !req.body.prodD || !req.file) {
//             return res.status(400).json({ error: 'Missing required fields' });
//         }

//         // Create the product in the database
//         const product = await db.product.create({
//             title: req.body.prodT,
//             description: req.body.prodD,
//             pic: req.file.path // Assuming multer saves the file path to req.file.path
//         });

//         // Process the uploaded image using the loaded model
//         const imageData = fs.readFileSync(req.file.path);
//         const imageTensor = tf.node.decodeImage(imageData);

//         if (!model) {
//             return res.status(500).json({ error: 'Model not loaded' });
//         }

//         const processedImageTensor = model.predict(imageTensor);
//         const processedImageData = await tf.node.encodePng(processedImageTensor);
//         const processedImageBase64 = Buffer.from(processedImageData).toString('base64');
//         const processedPic = `data:image/png;base64,${processedImageBase64}`;

//         // Send the processed image URL as a response
//         // res.status(200).json({ processedPic })
//         res.render('home', {processedPic : processedPic});
//     } catch (error) {
//         console.error('Error processing image:', error);
//         res.status(500).json({ error: 'Error processing image' });
//     }
// });


// router.post('/create-product', uploader.single('pic'), async (req, res) => {
//   try {
//       // Check if all required fields are present
//       if (!req.body.prodT || !req.body.prodD || !req.file) {
//           return res.status(400).json({ error: 'Missing required fields' });
//       }

//       // Create the product in the database
//       const product = await db.product.create({
//           title: req.body.prodT,
//           description: req.body.prodD,
//           pic: req.file.path // Assuming multer saves the file path to req.file.path
//       });

//       // Process the uploaded image using the loaded model
//       const imageData = fs.readFileSync(req.file.path);
//       const imageTensor = tf.node.decodeImage(imageData);

//       if (!model) {
//           return res.status(500).json({ error: 'Model not loaded' });
//       }

//       const processedImageTensor = model.predict(imageTensor);
//       const processedImageData = await tf.node.encodePng(processedImageTensor);
//       const processedImageBase64 = Buffer.from(processedImageData).toString('base64');
//       const processedPic = `data:image/png;base64,${processedImageBase64}`;
//       console.log('processedPic is :>> ', processedPic);

//       // Pass processedPic to the EJS template
//       res.render('home', { processedPic: processedPic });
//   } catch (error) {
//       console.error('Error processing image:', error);
//       res.status(500).json({ error: 'Error processing image' });
//   }
// });




router.get('/json-data', (req, res) => {
  // Read JSON file
  fs.readFile('output.json', 'utf8', (err, data) => {
      if (err) {
          console.error('Error reading JSON file:', err);
          res.status(500).send('Error reading JSON file');
          return;
      }

      // Parse JSON data
      const jsonData = JSON.parse(data);

      // Send JSON data as response
      res.json(jsonData);
  });
});



router.get('/', function(req, res, next) {
  res.render('index', { message : 'Please login to continue' });
});

router.post('/home', async function(req, res, next) { 
  // read username and password, check valid credential or not 
  let username = req.body.username;
  let password = req.body.password;

  let userlogin = await checkLogin(username, password);
  if(userlogin){
    // if successful , render home.ejs with the data
    req.session.username = username;
    req.session.logintime = new Date();
    req.session.userid = userlogin.userid;     // from session get userid
    req.session.user = userlogin;
    res.render('home', {username : username, pic : userlogin.pic});
  }else{
    // else failed login render index.ejs with proper message
    res.send("Login Failed");
  }

  // print the tweets of the user 
});

router.get('/createAccount', async function(req,res,next){
  res.render('account', {message : 'Please create your account'});
});

router.post('/createAccount', uploader.single('pic') , async function(req,res,next){
  let pass = req.body.password;
  let passhash = req.body.passwordhash;
  if(pass == passhash) {
    let userrec = {...req.body}; // spread operator
    userrec.pic = req.file.path; // multer is being used
    console.log('userrec', userrec);
    
    let usercreated = await createUser(userrec);
    
    res.redirect('/');
  } else {
    res.send("Password and Confirm Password mismatches");
  }
});


router.post('/checkAvailability' , async function(req,res,next){
  let username = req.body.username;
  let user = await db.users.findOne({where : {username : username}});
  if(user !== null){
    res.json({available : false, username : username});
  }
  else{
    res.json({available : true, username : username})
  }
});

router.get('/updateAccount', async function(req, res, next){
  
  if (!req.session.userid) {
    // If not logged in, redirect to the home page or login page
    return res.redirect('/');
  }
  let userid = req.session.userid;
  let user = req.session.user;
  res.render('updateProfile', {user:user, username: user.username});
})

router.post('/updateAccount', uploader.single('pic'), async function(req, res, next) {
  let username=req.body.username;
  let user = await db.users.findOne({where: {username : username}});
  let old=req.body.oldpassword;
  let newpass=req.body.password;
  let confirm=req.body.passwordhash;
  let check=await comparePass(old,user.passwordhash);
  if(check===true){
    if(newpass===confirm){
      let userrec = {...req.body};
      userrec.pic = req.file.path;   // Use of Multer
      //console.log('userrec', userrec);

      let userUpdates = await updateUser(userrec);
 
      res.redirect('/');
    }
    else{
      res.send("New Password and Confirm Password mismatches");
    }
  }
  else{
    res.send("Incorrect Password");
  }
});

router.get('/logout', async (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
      if (err) {
          console.log(err);
      } else {
          // Redirect to the home page
          res.redirect('/');
      }
  });
});

module.exports = router;
