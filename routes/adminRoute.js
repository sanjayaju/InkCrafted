const express = require('express');
const adminCtrl = require('../controllers/adminCtrl');
const productCtrl = require('../controllers/productCtrl');
const categoryCtrl = require('../controllers/categoryCtrl');
const orderCtrl = require('../controllers/orderCtrl')
const bannerCtrl = require('../controllers/bannerCtrl')
const upload = require('../config/multer');
const { isAdminLoggedIn, isAdminLoggedOut } = require('../middleware/auth')


const admin_route = express()


admin_route.set('views','./views/admin')


//Admin Login Handling
admin_route.get('/login', isAdminLoggedOut ,adminCtrl.loadAdminLogin);
admin_route.post('/login', isAdminLoggedOut, adminCtrl.verifyAdminLogin);
admin_route.post('/logout' ,adminCtrl.logoutAdmin)





admin_route.use('/', isAdminLoggedIn)

admin_route.get('/',adminCtrl.loadDashboard)

//user handlinng route
admin_route.get('/users',adminCtrl.loadUsers)
admin_route.get('/users/block/:id',adminCtrl.blockUser)


//Category Handling Routes
admin_route.get('/categories',categoryCtrl.loadCategories)
admin_route.post('/categories',categoryCtrl.addCategory);
admin_route.post('/categories/edit',upload.single('categoryImage'),categoryCtrl.editCategory)
admin_route.get('/categories/list/:id',categoryCtrl.listCategory)



//product handling route
admin_route.get('/products',productCtrl.loadProduct)
admin_route.get('/products/addproduct',productCtrl.loadAddProduct)
admin_route.post('/products/addproduct',upload.array('productImage',3),productCtrl.addProductDetails)
admin_route.get('/products/editProduct/:id',productCtrl.loadEditProduct)
admin_route.post('/products/editProduct',upload.array('productImage',3),productCtrl.postEditProduct)
admin_route.get("/products/deleteProduct/:id",productCtrl.deleteProduct)

admin_route.get('/products/imageDelete/:id',productCtrl.deleteImage)



admin_route.get('/ordersList',orderCtrl.loadOrdersList)
admin_route.get('/orderDetails/:orderId',orderCtrl.loadAdminOrderDetails)
// admin_route.post('/admin/changeOrderStatus/:orderId/:status', orderCtrl.changeOrderStatus);
admin_route.post('/changeOrderStatus',orderCtrl.changeOrderStatus)
admin_route.get('/cancelOrder/:orderId',orderCtrl.cancelOrder)
admin_route.get('/cancelSinglePrdt/:orderId/:pdtId',orderCtrl.cancelSinglePdt)
admin_route.get('/approveReturn/:orderId',orderCtrl.approveReturn) 

admin_route.get('/banners',bannerCtrl.loadBannerList) 
admin_route.post('/addBanner',upload.single('bannerImage'),bannerCtrl.addBanner)


module.exports = admin_route;

