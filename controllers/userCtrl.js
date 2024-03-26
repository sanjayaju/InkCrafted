const User = require('../models/userModel');
const Addresses = require('../models/addressModel')
const Products = require('../models/productModel')
const Categories = require('../models/categoryModel')
const Banners = require('../models/bannerModal')
const bcryptjs = require('bcryptjs')
const { securePassword } = require('../helpers/generator')
require('dotenv').config()
const nodemailer = require('nodemailer')
const { otpGen } = require("./otpgenarator")
const crypto = require('crypto')
const Razorpay = require('razorpay')
 

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret:  process.env.KEY_SECRET,
});


const loadHome = async(req,res, next) => {
  try {
      const isLoggedIn = Boolean(req.session.userId)
      const banners = await Banners.find({})

      res.render('home',{page : 'Home', isLoggedIn, banners});
  } catch (error) {
      next(error);
  }
}



const loadLogin = async (req, res, next) => {
  try {
    res.render('login');
  } catch (error) {
    next(error);
  }
}

const logoutUser = async (req, res, next) => {
  try {
    req.session.destroy()
    res.redirect('/')
  } catch (error) {
    next(error);
  }
}
const verifyLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email })

    if (userData) {
      const passwordMatch = await bcryptjs.compare(password, userData.password)
      if (passwordMatch) {

        if (!userData.isBlocked) {
          req.session.userId = userData._id
          req.session.cartCount = userData.cart.length
          req.session.wishCount = userData.wishlist.length
          res.redirect('/')
        } else {
          // If user is blocked, destroy the session and redirect to a blocked page
          req.session.destroy();
          res.render('blocked', { message: 'Sorry:( You are blocked by admins' });
          return;
        }
      } else {
        res.render('login', { message: 'Invalid Password' })
      }
    } else {
      res.render('login', { message: 'User does not exist' })
    }

  } catch (error) {
    next(error);
  }
}

const loadSignUp = async (req, res, next) => {
  console.log("entered load signup");
  try {
    console.log("entered loadsignup try");
    const { email } = req.query; // Assuming the email is sent as a query parameter

    if (email) {
      console.log("user exixt");
      // Check if the email already exists in the database
      const existUser = await User.findOne({ email });

      if (existUser) {
        console.log("hai no userkkkkk");
        return res.render('signup', { error: 'Email already exists.' });
      }
    } else {
      // If email is not provided, render the signup page without checking
      return res.render('signup');
    }

    // If the email is valid and not already used, proceed with OTP generation
    res.render('signup');
  } catch (error) {
    next(error);
  }
}

let userdata

const saveAndLogin = async (req, res, next) => {
  try {
    const { fname, lname, email, mobile, password, confirmPassword } = req.body;

    // Check if the password and confirmPassword match
    if (password === confirmPassword) {
      // Check if the email already exists in the database
      const existingUser = await User.findOne({ email: email });

      if (existingUser) {
        return res.render('signup', { message: 'User Already Exists' });
      }

      // Generate OTP and send verification email
      const OTP = otpGen();
      req.session.OTP = OTP;
      // req.session.userData = {
      userdata = req.body
      console.log(userdata, "lllllllllllll");


      // }

      sMail(email, OTP);

      // Set OTP session timeout
      setTimeout(() => {
        console.log('otp timeout, setting null');
        req.session.OTP = null;
      }, 600000);

      // Render the OTP validation page
      res.render('otp', { fname, lname, email, mobile, password, message: 'Check your mail. Enter the OTP....!' });
    }

    else {
      res.render('signup', { message: 'Password not matching' });
    }
  } catch (error) {
    next(error);
  }
};
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});
const sMail = (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Your OTP',
    text: `Your OTP is: ${otp}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};
const sendContactMail = async(name, email, subject, message) => {
  try {
      
      const mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: subject,
          html: `<h4>Hi I'm ${name}</h4><br><p>${message}</p>`
      }

      transporter.sendMail(mailOptions)

  } catch (error) {
      throw error
  }
}



const loadotp = async (req, res) => {
  try {
    console.log('otppageeeeeeeeeeee', req.body);
    res.render('otp')
  } catch (error) {
    console.log(error.message)
  }
}




const sendotp = (req, res) => {
  console.log(req.body, "reqqqqqqqqqqqq");
  let otp = otpGen()
  console.log(otp + 'ottppptt');
  req.session.OTP = otp;

  let email = userdata.email
  sMail(userdata.email, otp)

  res.redirect('/otp')


}
console.log(userdata, "kkkkkkkkk");


const validateOTP = async (req, res, next) => {
  try {
    console.log("hhhhhhhhhhhhhh");
    const { val1, val2, val3, val4, val5, val6 } = req.body;
    console.log(req.body, "bodyyyyyyyyyyyyyyyyyyyyyy");
    let formOtp = Number(val1 + val2 + val3 + val4 + val5 + val6);
    console.log(formOtp, 'generated otp');

    console.log(formOtp, req.session.OTP);
    console.log(req.session.OTP, "req.sessopn oyp");
    if (formOtp === Number(req.session.OTP)) {
      console.log('inside if case');
      console.log(userdata, 'userdataaaaaaaa');

      // Make sure userdata is defined before destructuring
      if (userdata) {
        let { fname, lname, email, mobile, password } = userdata;

        // Hash the password before saving
        const hashedPassword = await bcryptjs.hash(password, 10);

     

        const user = new User({
          fname: fname,
          lname: lname,
          email: email,
          mobile: mobile,
          password: hashedPassword,
        });
        console.log(user, "userrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr");
        await user.save();
        
       
        console.log(user, 'userrrr');
        res.render('signup', { successMessage: 'Signup successful. You ca now login.' });
      } else {
        console.error('userdata is undefined');
        res.redirect('/signup');
      }
    } else {
      console.log('otp didnt matched');
      res.render('otp', { errorMessage: 'Invalid OTP. Please try again' });
    }
  } catch (error) {
    next(error);
  }
};



const resendOTP = async (req, res, next) => {
  try {
    console.log('in resend otp controller');
    const { email } = req.body;

    // Call getOTP() again to generate a new OTP
    const OTP = req.session.OTP = otpGen();

    console.log('resending otp ' + OTP + ' to ' + email);

    setTimeout(() => {
      req.session.OTP = null; // Or delete req.session.otp;
      console.log('otp time out');
    }, 600000);

    sMail(email, OTP);

    res.json({ isResend: true });

  } catch (error) {
    next(error);
  }
};

const loadAboutUs = async(req,res, next) => {
  try {
      
      const isLoggedIn = Boolean(req.session.userId)
      const usersCount = await User.find().count()
      const activeUsers = await User.find({isBlocked:false}).count()
      const happyCustomers = Math.floor( (activeUsers*100)/usersCount )
      const categoriesCount = await Categories.find({isListed:true}).count()

      res.render('aboutUs',{page : 'About Us',isLoggedIn, usersCount, happyCustomers, categoriesCount})
  } catch (error) {
      next(error);
  }
}

const loadShoppingCart = async(req, res, next) => {
  try {
      const userId = req.session.userId;
      const userData = await User.findById({_id:userId}).populate('cart.productId').populate('cart.productId.offer')
      const cartItems = userData.cart

      //Code to update cart values if product price changed by admin after we added pdt into cart
      for(const { productId } of cartItems ){
          await User.updateOne(
              { _id: userId, 'cart.productId': productId._id },
              {
                  $set: {
                      'cart.$.productPrice': productId.price,
                      'cart.$.discountPrice': productId.discountPrice
                  }
              }
          )
      }

      res.render('shoppingCart',{page: 'Shopping Cart', parentPage: 'Shop', isLoggedIn: true, userData, cartItems})
  } catch (error) {
      next(error); 
  }
}

console.log("add to cart");

const addToCart = async(req, res, next) => {
  try {
      const pdtId = req.params.id;
      const userId = req.session.userId;

      const userData = await User.findById({_id:userId})
      const pdtData = await Products.findById({_id: pdtId})
      
      if(pdtData.quantity){
          
          const isproductExist = userData.cart.findIndex((pdt) => pdt.productId == pdtId)
          if(isproductExist === -1){


              const cartItem = {
                  productId : pdtId,
                  quantity : 1,
                  productPrice : pdtData.price,
                  discountPrice : pdtData.discountPrice
              }
      
              await User.findByIdAndUpdate(
                  {_id: userId},
                  {
                      $push:{
                          cart: cartItem
                      }
                  }
              )
  
              req.session.cartCount++;

          }else{
                  
              await User.updateOne(
                  {_id: userId, 'cart.productId' : pdtId},
                  {
                      $inc:{
                          "cart.$.quantity":1
                      }
                  }
              );
  
              console.log('Product already exist on cart, quantity incremeted by 1');
          }

      }

      res.redirect('/shoppingCart')

  } catch (error) {
      next(error);
  }
}
const updateCart = async(req, res, next) => {
  try {
      const userId = req.session.userId;
      const quantity = parseInt(req.body.amt)
      const prodId = req.body.prodId

      const pdtData = await Products.findById({ _id: prodId })

      const stock = pdtData.quantity;
      let totalSingle
      if(pdtData.offerPrice){
          totalSingle = quantity*pdtData.offerPrice
      }else{
          totalSingle = quantity*(pdtData.price - pdtData.discountPrice)
      }

      if(stock >= quantity){
          await User.updateOne(
              { _id: userId, 'cart.productId' : prodId },
              {
                  $set: {
                      'cart.$.quantity' : quantity
                  }
              }
          );

          const userData =  await User.findById({_id: userId}).populate('cart.productId')
          let totalPrice = 0;
          let totalDiscount = 0;
          userData.cart.forEach(pdt => {

              totalPrice += pdt.productPrice*pdt.quantity
              if(pdt.productId.offerPrice){
                  totalDiscount += (pdt.productPrice - pdt.productId.offerPrice)*quantity
              }else{
                  totalDiscount += pdt.discountPrice*pdt.quantity
              }
          })

          res.json({
              status: true,
              data: { totalSingle, totalPrice, totalDiscount }
          })
      }else{
          res.json({
              status: false,
              data: 'Sorry the product stock has been exceeded'
          })
      }
  } catch (error) {
      next(error);
  }
}



const removeCartItem = async(req, res, next) => {
  try {
      
      const pdtId = req.params.id;
      const userId = req.session.userId;

      const userData = await User.findOneAndUpdate(
          {_id: userId, 'cart.productId': pdtId },
          {
              $pull: {
                  cart:{
                      productId : pdtId
                  } 
              }
          }
      );

      req.session.cartCount--;

      res.redirect('/shoppingCart');

  } catch (error) {
      next(error);
  }
}



const loadProfile = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const userData = await User.findById({ _id: userId })
    const userAddress = await Addresses.findOne({ userId: userId })

    res.render('userProfile', { userData, userAddress, isLoggedIn: true, page: 'Profile' })
  } catch (error) {
    next(error);
  }
}


const loadEditProfile = async (req, res, next) => {
  try {
    id = req.session.userId;
    const userData = await User.findById({ _id: id })
    res.render('editProfile', { userData })
  } catch (error) {
    next(error);
  }
}

const postEditProfile = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { fname, lname, mobile, dob } = req.body
    await User.findByIdAndUpdate(
      { _id: userId },
      {
        $set: {
          fname, lname, mobile, dob
        }
      }
    );

    res.redirect('/profile');

  } catch (error) {
    next(error);
  }
}

const loadPassConfirmToChangeMail = async(req,res, next) => {
  try {
      res.render('passConfirmToChangeMail')
  } catch (error) {
      next(error);
  }
}

const postPassConfirmToChangeMail = async(req,res, next) => {
  try {
      const id = req.session.userId;
      const password = req.body.password
      const userData = await User.findById({ _id: id })
      const passwordMatch = await bcryptjs.compare(password,userData.password)
      if(passwordMatch){
          res.redirect('/profile/changeMail')
      }else{
          res.redirect('/profile/')
      }
  } catch (error) {
      next(error);
  }
}

const loadChangeMail = async(req,res, next) => {
  try {
      res.render('changeMail')
  } catch (error) {
      next(error);
  }
}

const postChangeMail = async(req,res, next) => {
  try {

      const newMail = req.body.email

      const isMailExist = await User.findOne({email:newMail})

      if(isMailExist){
          console.log('Mail Already Exist');
          return
      }else{
          
          const OTP = req.session.OTP = otpGen()
          console.log('OTP generated when posted new email '+OTP);

          setTimeout(() => {
              req.session.OTP = null; // Or delete req.session.otp;
              console.log('otp time out');
          }, 600000); 

          sMail(newMail, OTP); 
          req.session.newMail = newMail
          res.render('otpToChangeMail')
      }


  } catch (error) {
      next(error);
  }
}


const otpValidationToChangeMail = async(req, res, next) => {
  try {
      const userId = req.session.userId;
      const newMail = req.session.newMail;
      const OTP = req.body.OTP;
      const adminOTP = req.session.OTP

      if(OTP == adminOTP){

          await User.findByIdAndUpdate(
              {_id:userId},
              {
                  $set:{
                      email: newMail
                  }
              }
          );
          res.redirect('/profile')

      }else{
          console.log('OTP not correct');
      }
  } catch (error) {
      next(error);
  }
}


const loadChangePassword = async (req, res, next) => {
  try {
    console.log('loaded change password page');
    res.render('changePass')
    console.log('wow');
  } catch (error) {
    next(error);
  }
}


console.log("hohoho");
const postChangePassword = async (req, res, next) => {
  try {
    console.log('posted change password');

    const userId = req.session.userId;
    console.log('User ID:', userId);
    const { oldPassword, newPassword, conformPassword } = req.body;
    console.log('Old Password:', oldPassword);
    console.log('New Password:', newPassword);
    console.log('Conform Password:', conformPassword);

    const userData = await User.findById({ _id: userId });
    console.log('User Data:', userData);

    // Check if newPassword and conformPassword match
    if (newPassword !== conformPassword) {
      console.log('Passwords do not match');
      return res.redirect('/profile/changePassword');
    }

    const passwordMatch = await bcryptjs.compare(oldPassword, userData.password);
    console.log('Password Match:', passwordMatch);

    // Check if the old password is correct
    if (passwordMatch) {
      // Hash the new password
      const hashedNewPassword = await securePassword(newPassword, 10);
      console.log('Hashed New Password:', hashedNewPassword);

      // Update the user's password in the database
      await User.findByIdAndUpdate(
        { _id: userId },
        {
          $set: {
            password: hashedNewPassword
          }
        }
      );
      console.log('Password successfully changed. Redirecting to /profile');
      return res.redirect('/profile');
    } else {
      // Old password doesn't match
      console.log('Old password does not match');
      return res.redirect('/profile/changePassword');
    }
  } catch (error) {
    console.error('Error:', error);
    next(error);
  }
};

const forgotPassword = async(req, res, next) => {
  try {
      console.log('loaded forgot password');
      const userMail = await User.findById({_id: req.session.userId},{email:1,_id:0})
      const OTP = req.session.OTP = otpGen() 
      sMail(userMail.email, OTP);
      setTimeout(() => {
          req.session.OTP = null; // Or delete req.session.otp;
          console.log('otp time out');
      }, 600000); 
      res.render('forgotPasswordVerification')

  } catch (error) {
      next(error);
  }
}


const verifyOTPforgotPass = async(req, res, next) => {
  try {
      const userOTP = req.body.OTP
      const adminOTP = req.session.OTP
      if(userOTP == adminOTP){
          res.render('resetPassword')
      }else{
          console.log('OTP not matching .... :(');
          res.redirect('/profile/forgotPassword')
      }
  } catch (error) {
      next(error);
  }
}

const loadResetPassword = async(req, res, next) => {
  try {
      res.render('resetPassword')
  } catch (error) {
      next(error);
  }
}

const postResetPassword = async(req, res, next) => {
  try {
      const { newPassword, confirmPassword} = req.body
      if(newPassword !== confirmPassword){
          return res.redirect('/profile/resetPassword');
      }else{
          const userId = req.session.userId;
          const sPassword = await securePassword(newPassword)
          await User.findByIdAndUpdate(
              { _id: userId },
              {
                  $set:{
                      password:sPassword
                  }
              }
          );
          console.log('password updated');
          return res.redirect('/profile');
      }
  } catch (error) {
      next(error);
  }
}


const loadWalletHistory = async(req, res, next) => {
  try {
      const userId = req.session.userId;
      const userData = await User.findById({_id: userId})
      const walletHistory = userData.walletHistory.reverse()
      res.render('walletHistory',{isLoggedIn:true, userData, walletHistory, page:'Profile'})
  } catch (error) {
      next(error)
  }
}



const addMoneyToWallet = async(req, res, next) => {
  try {
      console.log('adding money to wallet');
      const { amount } = req.body
      const  id = crypto.randomBytes(8).toString('hex')

      var options = {
          amount: amount*100,
          currency:'INR',
          receipt: "hello"+id
      }

      instance.orders.create(options, (err, order) => {
          if(err){
              res.json({status: false})
          }else{
              res.json({ status: true, payment:order })
          }

      })
  } catch (error) {
      next(error)
  }
}



const loadWishlist = async(req, res, next) => {
  try {
      console.log('loading wishlist');
      const userId = req.session.userId
      const isLoggedIn = Boolean(req.session.userId)
      const userData = await User.findById({_id:userId}).populate('wishlist')
      const wishlist = userData.wishlist
      res.render('wishlist',{page:'Wishlist', parentPage:'Shop', isLoggedIn, wishlist})
  } catch (error) {
      next(error)
  }
}

const addToWishlist = async(req, res, next) => {
  try {
      const { productId } = req.params
      const { userId } = req.session
      const userData = await User.findById({_id: userId});
      if(!userData.wishlist.includes(productId)){
          userData.wishlist.push(productId)
          await userData.save()
          req.session.wishCount++
      }
      let { returnPage } = req.query
      if(returnPage == 'shop'){
          res.redirect('/shop')
      }else if(returnPage == 'productOverview'){
          res.redirect(`/shop/productOverview/${productId}`)
      }
  } catch (error) {
      next(error)
  }
}
const removeWishlistItem = async(req, res, next) => {
  try {
      const { productId } = req.params
      const { userId } = req.session
      await User.findByIdAndUpdate(
          {_id: userId},
          {
              $pull:{
                  wishlist: productId
              }
          }
      );
      req.session.wishCount--
      const { returnPage } = req.query
      if(returnPage == 'shop'){
          res.redirect('/shop')
      }else if(returnPage == 'productOverview'){
          res.redirect(`/shop/productOverview/${productId}`)
      }else if(returnPage == 'wishlist'){
          res.redirect('/wishlist')
      }
  } catch (error) {
      next(error)
  }
}


const contactUs = async(req, res, next) => {
  try {
      console.log('sending mail');
      const { fullname, email, subject, message } = req.body
      await sendContactMail(fullname, email, subject, message)
      res.json({ status: true })
  } catch (error) {
     res.json({ status: false })
  }
}


module.exports = {
  loadHome,
  loadLogin,
  logoutUser,
  verifyLogin,
  loadSignUp,
  saveAndLogin,
  validateOTP,
  resendOTP,
  loadAboutUs,
  sendotp,
  loadotp,
  loadShoppingCart,
  addToCart,
  updateCart,
  removeCartItem,
  loadProfile,
  loadEditProfile,
  postEditProfile,
  loadPassConfirmToChangeMail,
  postPassConfirmToChangeMail,
  loadChangeMail,
  postChangeMail,
  otpValidationToChangeMail,
  loadChangePassword,
  postChangePassword,
  forgotPassword,
  verifyOTPforgotPass,
  loadResetPassword,
  postResetPassword,
  loadWalletHistory,
  addMoneyToWallet,
  loadWishlist,
  addToWishlist,
  removeWishlistItem,
  contactUs
}





