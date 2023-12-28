const User = require('../models/userModel');
const Addresses = require('../models/addressModel')
const Products = require('../models/productModel')
const bcrypt = require('bcrypt')
require('dotenv').config()
const nodemailer = require('nodemailer')
const { otpGen } = require("./otpgenarator")
const crypto = require('crypto')
const Razorpay = require('razorpay')
 

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret:  process.env.KEY_SECRET,
});


const loadHome = async (req, res, next) => {
  try {
    const isLoggedIn = Boolean(req.session.userId);

    // Fetch additional user data based on the userId
    if (isLoggedIn) {
      const userData = await User.findById(req.session.userId);
      const userName = userData ? `${userData.fname} ${userData.lname}` : '';
      res.render('home', { page: 'Home', isLoggedIn, userName });
    } else {
      res.render('home', { page: 'Home', isLoggedIn });
    }
  } catch (error) {
    next(error);
  }
};


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
      const passwordMatch = await bcrypt.compare(password, userData.password)
      if (passwordMatch) {

        if (!userData.isBlocked) {
          req.session.userId = userData._id
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

const sMail = ((email, otp) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    }
  });


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
})



const loadotp = async (req, res) => {
  try {
    console.log('otppageeeeeeeeeeeeeeeeeeeeeeeeee', req.body);
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
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
          fname: fname,
          lname: lname,
          email: email,
          mobile: mobile,
          password: hashedPassword, // Save the hashed password
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
    const { email } = req.body
    const OTP = req.session.OTP = getOTP()
    console.log('resending otp ' + OTP + ' to ' + email);
    setTimeout(() => {
      req.session.OTP = null; // Or delete req.session.otp;
      console.log('otp time out');
    }, 600000);
    sendVerifyMail(email, OTP);

    res.json({ isResend: true })

  } catch (error) {
    next(error);
  }
}

const loadShoppingCart = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const userData = await User.findById({ _id: userId }).populate('cart.productId').populate('cart.productId.offer');
    const cartItems = userData.cart;

    // Code to update cart values if product price changed by admin after we added pdt into cart
    for (const { productId } of cartItems) {
      await User.updateOne(
        { _id: userId, 'cart.productId': productId._id },
        {
          $set: {
            'cart.$.productPrice': productId.price,
            // Remove the line for 'cart.$.discountPrice'
          }
        }
      );
    }
     console.log("cart is here");
    res.render('shoppingCart', { page: 'Shopping Cart', parentPage: 'Shop', isLoggedIn: true, userData, cartItems });
    console.log("cart page");
  } catch (error) {
    console.log("cart error");
    next(error);
  }
};

console.log("add to cart");
const addToCart = async (req, res, next) => {
  try {
      const pdtId = req.params.id;
      const userId = req.session.userId;

      const userData = await User.findById({ _id: userId });
      const pdtData = await Products.findById({ _id: pdtId });

      if (pdtData.quantity) {
          const isproductExist = userData.cart.findIndex((pdt) => pdt.productId == pdtId);
          if (isproductExist === -1) {
              const cartItem = {
                  productId: pdtId,
                  quantity: 1,
                  productPrice: pdtData.price,
              };

              await User.findByIdAndUpdate(
                  { _id: userId },
                  {
                      $push: {
                          cart: cartItem,
                      },
                  }
              );

              req.session.cartCount++;
          } else {
              await User.updateOne(
                  { _id: userId, 'cart.productId': pdtId },
                  {
                      $inc: {
                          'cart.$.quantity': 1,
                      },
                  }
              );

              console.log('Product already exists in the cart, quantity incremented by 1');
          }
      }

      res.redirect('/shoppingCart');
  } catch (error) {
      next(error);
  }
};


const updateCart = async (req, res, next) => {
  try {
      const userId = req.session.userId;
      const quantity = parseInt(req.body.amt);
      const prodId = req.body.prodId;

      const pdtData = await Products.findById({ _id: prodId });

      const stock = pdtData.quantity;
      const totalSingle = quantity * pdtData.price;

      if (stock >= quantity) {
          await User.updateOne(
              { _id: userId, 'cart.productId': prodId },
              {
                  $set: {
                      'cart.$.quantity': quantity,
                  },
              }
          );

          const userData = await User.findById({ _id: userId }).populate('cart.productId');
          let totalPrice = 0;

          userData.cart.forEach((pdt) => {
              totalPrice += pdt.productPrice * pdt.quantity;
          });

          res.json({
              status: true,
              data: { totalSingle, totalPrice },
          });
      } else {
          res.json({
              status: false,
              data: 'Sorry, the product stock has been exceeded',
          });
      }
  } catch (error) {
      next(error);
  }
};




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

    const passwordMatch = await bcrypt.compare(oldPassword, userData.password);
    console.log('Password Match:', passwordMatch);

    // Check if the old password is correct
    if (passwordMatch) {
      // Hash the new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
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

const loadWalletHistory = async(req, res, next) => {
  try {
      const userId = req.session.userId;
      const userData = await User.findById({_id: userId})
      const walletHistory = userData.walletHistory.reverse()
      res.render('walletHistory',{isLoggedIn:true, userData,walletHistory, page:'Profile'})
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



module.exports = {
  loadHome,
  loadLogin,
  logoutUser,
  verifyLogin,
  loadSignUp,
  saveAndLogin,
  validateOTP,
  resendOTP,
  sendotp,
  loadotp,
  loadShoppingCart,
  addToCart,
  updateCart,
  removeCartItem,
  loadProfile,
  loadEditProfile,
  postEditProfile,
  loadChangePassword,
  postChangePassword,
  loadWalletHistory,
  addMoneyToWallet
}





