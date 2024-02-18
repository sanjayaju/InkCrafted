const express = require('express');
const userCtrl = require('../controllers/userCtrl');
const productCtrl = require('../controllers/productCtrl')
const addressCtrl = require('../controllers/addressCtrl')
const orderCtrl = require('../controllers/orderCtrl')
const {isUserLoggedIn, isUserLoggedOut ,isUserBlocked} = require('../middleware/auth')

const user_route = express();

user_route.set('views','./views/user');


user_route.use( async(req, res, next) => {
    res.locals.cartCount = req.session.cartCount
    res.locals.wishCount = req.session.wishCount
    next()
})


user_route.use('/', isUserBlocked);

// HTTP Mehtods
user_route.get('/',userCtrl.loadHome); 

user_route.get('/login', isUserLoggedOut ,userCtrl.loadLogin);
user_route.post('/login', isUserLoggedOut,userCtrl.verifyLogin);
user_route.get('/otp',userCtrl.loadotp)
user_route.get('/signup', isUserLoggedOut,userCtrl.loadSignUp);
//  user_route.post('/otp', isUserLoggedOut,userCtrl.verifyotp);
user_route.post('/signup', isUserLoggedOut,userCtrl.saveAndLogin);


 user_route.post('/validateotp',userCtrl.validateOTP)
user_route.post('/resendOTP',userCtrl.resendOTP)

user_route.post('/signup',userCtrl.sendotp)

user_route.get('/shop',productCtrl.loadShop)
user_route.get('/shop/productOverview/:id',productCtrl.loadProductOverview);
user_route.get('/aboutUs',userCtrl.loadAboutUs);
user_route.post('/contactForm',userCtrl.contactUs);


//to check isUserLoggedIn after this route
user_route.use('/', isUserLoggedIn)


user_route.get('/logout', userCtrl.logoutUser);


user_route.get('/shoppingCart',userCtrl.loadShoppingCart)
user_route.get('/shop/addToCart/:id',userCtrl.addToCart)
user_route.post('/shoppingCart/removeItem/:id',userCtrl.removeCartItem)
user_route.put('/updateCart',userCtrl.updateCart);
user_route.get('/shoppingCart/proceedToCheckout',orderCtrl.loadCheckout)
user_route.post('/shoppingCart/placeOrder',orderCtrl.placeOrder)
user_route.get('/wishlist',userCtrl.loadWishlist)
user_route.get('/addToWishlist/:productId',userCtrl.addToWishlist)
user_route.get('/removeWishlistItem/:productId',userCtrl.removeWishlistItem)



user_route.get('/orderSuccess',orderCtrl.loadOrderSuccess)
user_route.post('/verifyPayment',orderCtrl.verifyPayment)


user_route.get('/profile',userCtrl.loadProfile)
user_route.get('/profile/edit',userCtrl.loadEditProfile)
user_route.post('/profile/edit',userCtrl.postEditProfile)



user_route.get('/profile/addAddress',addressCtrl.loadAddAddress)
user_route.post('/profile/addAddress/:returnPage',addressCtrl.postAddAddress)
user_route.get('/profile/editAddress/:id',addressCtrl.loadEditAddress)
user_route.post('/profile/editAddress/:id',addressCtrl.postEditAddress)
user_route.get('/profile/deleteAddress/:id',addressCtrl.deleteAddress)


user_route.get('/profile/changePassword',userCtrl.loadChangePassword)
user_route.post('/profile/changePassword',userCtrl.postChangePassword)





user_route.get('/profile/myOrders',orderCtrl.loadMyOrders)
user_route.get('/viewOrderDetails/:orderId',orderCtrl.loadViewOrderDetails)
user_route.get('/cancelOrder/:orderId',orderCtrl.cancelOrder)
user_route.get('/cancelSinglePrdt/:orderId/:pdtId',orderCtrl.cancelSinglePdt)
user_route.get('/returnOrder/:orderId',orderCtrl.returnOrder)


user_route.get('/profile/walletHistory',userCtrl.loadWalletHistory)
user_route.post('/profile/addMoneyToWallet/',userCtrl.addMoneyToWallet)

module.exports = user_route;