const User = require('../models/userModel');
const Products = require('../models/productModel');
const Addresses = require('../models/addressModel');
const Orders = require('../models/orderModel');
require('dotenv').config()
const Razorpay = require('razorpay');
const { updateWallet } = require('../helpers/helpersFunctions')
const { log } = require('console');


var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret:  process.env.KEY_SECRET,
});

const loadCheckout = async(req, res, next) => {
    try {
        const userId = req.session.userId;

        const userAddress = await Addresses.findOne({ userId: userId})
        const userData = await User.findById({_id: userId}).populate('cart.productId')
        const cart = userData.cart
        
        if(!cart){
            return redirect('/shoppingCart')
        }

       
        res.render('checkout',{isLoggedIn : true, page:'Checkout', userAddress, cart,userId})
    } catch (error) {
        next(error);
    }
}

console.log(" before entering place order");
const placeOrder = async (req, res, next) => {
    console.log("in the place order");
    try {
        // getting details needed
        const addressId = req.body.address;
        const paymentMethod = req.body.payment;
        const userId = req.session.userId;

        // getting selected address
        const userAddress = await Addresses.findOne({ userId });
        const address = userAddress.addresses.find(
            (obj) => obj._id.toString() === addressId
        );
        req.session.deliveryAddress = address;

        // getting cart items
        const userData = await User.findById({ _id: userId }).populate(
            'cart.productId'
        );
        const cart = userData.cart;
        req.session.cart = cart;

        let products = [];

        cart.forEach((pdt) => {
            const product = {
                productId: pdt.productId._id,
                productName: pdt.productId.name,
                productPrice: pdt.productId.price,
                quantity: pdt.quantity,
                totalPrice: pdt.quantity * pdt.productId.price,
                status: 'Order Confirmed',
            };
            products.push(product);
        });

        req.session.products = products;

        let totalPrice = 0;
        if (cart.length) {
            // Finding total price
            for (let i = 0; i < products.length; i++) {
                totalPrice += products[i].totalPrice;
            }
            console.log(totalPrice);

            req.session.totalPrice = totalPrice;
            console.log(totalPrice);

            if (paymentMethod === 'COD') {
                console.log('Payment method is COD');

                await new Orders({
                    userId,
                    deliveryAddress: address,
                    totalPrice,
                    products,
                    paymentMethod,
                    status: 'Order Confirmed',
                }).save();

                // Reducing quantity/stock of purchased products from Products Collection
                for (const { productId, quantity } of cart) {
                    await Products.updateOne(
                        { _id: productId._id },
                        { $inc: { quantity: -quantity } }
                    );
                }

                // Deleting Cart from user collection
                await User.findByIdAndUpdate(
                    { _id: userId },
                    {
                        $set: {
                            cart: [],
                        },
                    }
                );

                req.session.cartCount = 0;
                res.json({ status: 'COD' });
            } else if (paymentMethod === 'Razorpay') {
                console.log('Payment method razorpay');

                var options = {
                    amount: totalPrice * 100,
                    currency: 'INR',
                    receipt: 'hello',
                };
                instance.orders.create(options, (err, order) => {
                    if (err) {
                        console.log('Razorpay error:', err);
                    } else {
                        console.log('Razorpay order:', order);
                        res.json({ status: 'Razorpay', order: order });
                    }
                });
                
            }
        } else {
            console.log('Cart is empty');
            res.redirect('/shop');
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};


const verifyPayment = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        const details = req.body;

        const crypto = require('crypto');
        let hmac = crypto.createHmac('sha256', process.env.KEY_SECRET);

        hmac.update(details['response[razorpay_order_id]'] + '|' + details['response[razorpay_payment_id]']);
        hmac = hmac.digest('hex');
        if (hmac === details['response[razorpay_signature]']) {

            let totalPrice = req.session.totalPrice;

            await new Orders({
                userId,
                deliveryAddress: req.session.deliveryAddress,
                totalPrice,
                products: req.session.products,
                paymentMethod: 'Razorpay',
                status: 'Order Confirmed',
            }).save();

            // Reducing quantity/stock of purchased products from Products Collection
            const cart = req.session.cart;
            for (const { productId, quantity } of cart) {
                await Products.updateOne(
                    { _id: productId._id },
                    { $inc: { quantity: -quantity } }
                );
            }

            // Deleting Cart from user collection
            await User.findByIdAndUpdate(
                { _id: userId },
                {
                    $set: {
                        cart: []
                    }
                }
            );

            req.session.cartCount = 0;

            res.json({ status: true });
        } else {
            res.json({ status: false });
        }

    } catch (error) {
        next(error);
    }
};


const loadMyOrders = async(req, res, next) => {
    try {
        console.log('Loaded my orders');
        const userId = req.session.userId;
        const orderData = await Orders.find({userId}).populate('products.productId').sort({createdAt: -1})
        res.render('myOrders',{isLoggedIn:true, page: 'My Orders', parentPage: 'Profile',orderData})
    } catch (error) {
        next(error);
    }
}

const loadViewOrderDetails = async(req, res, next) => {
    try {
        // console.log('loaded view order details page');
        const orderId = req.params.orderId;
        const userId = req.session.userId;
        console.log(req.params,'kkkkk')
        const orderData = await Orders.findOne({_id:orderId}).populate('products.productId')
        console.log(orderData);

        let status;
        switch(orderData.status){
            case 'Order Confirmed':
                status = 1;
                break;
            case 'Shipped':
                status = 2;
                break;
            case 'Out For Delivery':
                status = 3;
                break;
            case 'Delivered':
                status = 4;
                break;
            case 'Cancelled' :
                status = 5;
                break;
            case 'Cancelled By Admin':
                status = 6;
                break;
                case 'Pending Return Approval':
                    status = 7;
                    break;
                case 'Returned':
                    status = 8;
                    break;
        }
        console.log('Order Status:', orderData.status);
        res.render('orderDetails',{isLoggedIn:true, page :'Order Details', parentPage: 'My Orders',orderData, status})
        console.log('Order Status:', orderData.status);
    } catch (error) {
        next(error);
    }
}

const loadAdminOrderDetails = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        console.log('Order ID:', orderId);

        // Retrieve orderData from the database
        const orderData = await Orders.findById({ _id: orderId }).populate('products.productId');
        console.log('Order Data:', orderData);

        // Render the view
        res.render('orderDetails', { orderData, page: 'Orders List' });
    } catch (error) {
        console.error('Error in loadAdminOrderDetails:', error);
        next(error);
    }
};
console.log("its not entered");



const loadOrderSuccess = async(req, res, next) => {
    try {
        const result = req.query.result
        // console.log('loaded Order Success');
        const isLoggedIn = Boolean(req.session.userId)

        res.render('orderSuccess',{isLoggedIn, result})
    } catch (error) {
        next(error);
    }
}

const loadOrdersList = async(req, res, next) => {
    try {

        let pageNum = 1;
        if(req.query.pageNum){
            pageNum = parseInt(req.query.pageNum) 
        }

        let limit = 10;
        if(req.query.limit){
            limit = parseInt(req.query.limit);
        }

        const totalOrderCount = await Orders.find({}).count()
        let pageCount = Math.ceil( totalOrderCount / limit)

        const ordersData = await Orders.find({}).populate('userId').populate('products.productId').sort({ createdAt: -1 }).skip( (pageNum - 1)*limit ).limit(limit);
        console.log("order list");
        res.render('ordersList',{ordersData, page:'Orders List',pageCount, pageNum, limit})
    } catch (error) {
        next(error);
    }
}


// const changeOrderStatus = async(req,res, next) => {
//     console.log('Entering changeOrderStatus');
//     res.send('Hello from changeOrderStatus');
//     try {
//         const orderId = req.body.orderId
//         const status = req.body.status
//         const orderData = await Orders.findById({_id: orderId})
//         for (const pdt of orderData.products){

//             if(pdt.status !== 'Delivered' && 
//                 pdt.status !== 'Pending Return Approval' &&
//                 pdt.status !== 'Cancelled' && 
//                 pdt.status !== 'Cancelled By Admin' && 
//                 pdt.status !== 'Returned'
//             ){
//                 pdt.status = status
//             }

//         };
//         console.log('Before orderData.save()');
//         await orderData.save();

//         console.log('Before updateOrderStatus');
//         await updateOrderStatus(orderId, next);

//         console.log('Before res.redirect');
//         res.redirect('/admin/ordersList');
//     } catch (error) {
//         console.error('Error in changeOrderStatus:', error);
//         next(error);
//     }
// }

// const updateOrderStatus = async function (orderId, next) {
//     try {
//         // Step 1: Initialize an array to store status counts
//         let statusCounts = [];

//         // Step 2: Find the order data by its ID
//         const orderData = await Orders.findById({ _id: orderId });

//         // Step 3: Count the occurrences of each status in the order's products
//         orderData.products.forEach((pdt) => {
//             let eachStatusCount = {
//                 status: pdt.status,
//                 count: 1,
//             };

//             let existingStatusIndex = statusCounts.findIndex(
//                 (item) => item.status === pdt.status
//             );

//             if (existingStatusIndex !== -1) {
//                 // Increment the count of an existing status
//                 statusCounts[existingStatusIndex].count += 1;
//             } else {
//                 statusCounts.push(eachStatusCount);
//             }
//         });

//         // Step 4: Check if there is only one status, set order status to that status, and save
//         if (statusCounts.length === 1) {
//             orderData.status = statusCounts[0].status;
//             await orderData.save();
//             return;
//         }

//         // Step 5: Check for specific status conditions and update order status accordingly
//         // Check if 'Order Confirmed' exists
//         let isOrderConfirmedExists = false;
//         // Check if 'Shipped' exists
//         let isShippedExists = false;
//         // Check if 'Out For Delivery' exists
//         let isOutForDeliveryExists = false;
//         // Check if 'Delivered' exists
//         let isDeliveredExists = false;
//         // Count of 'Cancelled' status by user
//         let cancelledByUserCount;
//         // Count of 'Cancelled By Admin' status
//         let cancelledByAdminCount;
//         // Count of 'Pending Return Approval' status
//         let returnApprovalCount;
//         // Count of 'Returned' status
//         let returnedCount;

//         // Iterate through status counts to set flags and counts
//         statusCounts.forEach((item) => {
//             if (item.status === 'Order Confirmed') {
//                 isOrderConfirmedExists = true;
//             }

//             if (item.status === 'Shipped') {
//                 isShippedExists = true;
//             }

//             if (item.status === 'Out For Delivery') {
//                 isOutForDeliveryExists = true;
//             }

//             if (item.status === 'Delivered') {
//                 isDeliveredExists = true;
//             }

//             if (item.status === 'Cancelled') {
//                 cancelledByUserCount = item.count;
//             }

//             if (item.status === 'Cancelled By Admin') {
//                 cancelledByAdminCount = item.count;
//             }

//             if (item.status === 'Pending Return Approval') {
//                 returnApprovalCount = item.count;
//             }

//             if (item.status === 'Returned') {
//                 returnedCount = item.count;
//             }
//         });

//         // Step 6: Update order status based on specific conditions
//         // ...

//         if(isOrderConfirmedExists){
//             orderData.status = 'Order Confirmed'
//             await orderData.save()
//             return
//         }
        
//         if(isShippedExists){
//             orderData.status = 'Shipped'
//             await orderData.save()
//             return
//         }

//         if(isOutForDeliveryExists){
//             orderData.status = 'Out For Delivery'
//             await orderData.save()
//             return
//         }


//         if(isDeliveredExists){
//             orderData.status = 'Delivered'
//             await orderData.save()
//             return
//         }

//         let cancelledCount = 0;
//         if(cancelledByUserCount){
//             cancelledCount += cancelledByUserCount
//         }
//         if(cancelledByAdminCount){
//             cancelledCount += cancelledByAdminCount
//         }

//         if(cancelledByUserCount === orderData.products.length || cancelledCount === orderData.products.length){
//             orderData.status = 'Cancelled'
//             await orderData.save()
//             return;
//         }
        
//         if(cancelledByAdminCount === orderData.products.length){
//             orderData.status = 'Cancelled By Admin'
//             await orderData.save()
//             return;
//         }

//         if( cancelledCount + returnApprovalCount + returnedCount === orderData.products.length){
//             orderData.status = 'Pending Return Approval'
//             await orderData.save()
//             return;
//         }

//         if( cancelledCount + returnedCount === orderData.products.length){
//             orderData.status = 'Returned'
//             await orderData.save()
//             return;
//         }


//     } catch (error) {
//         next(error);
//     }
// };


const changeOrderStatus = async(req,res, next) => {
    try {
        const orderId = req.body.orderId
        const status = req.body.status
        const orderData = await Orders.findById({_id: orderId})
        for (const pdt of orderData.products){

            if(pdt.status !== 'Delivered' && 
                pdt.status !== 'Pending Return Approval' &&
                pdt.status !== 'Cancelled' && 
                pdt.status !== 'Cancelled By Admin' && 
                pdt.status !== 'Returned'
            ){
                pdt.status = status
            }

        };
        console.log('orderData saving');
        await orderData.save();
        await updateOrderStatus(orderId, next);

        res.redirect('/admin/ordersList')

    } catch (error) {
        next(error);
    }
}


const updateOrderStatus = async function (orderId, next) {
    try {

            let statusCounts = []
            const orderData = await Orders.findById({ _id: orderId })
            orderData.products.forEach((pdt) => {
                let eachStatusCount = {
                    status: pdt.status,
                    count: 1,
                };
            
                let existingStatusIndex = statusCounts.findIndex(
                    (item) => item.status === pdt.status
                );
            
                if (existingStatusIndex !== -1) {
                    // Increment the count of an existing status
                    statusCounts[existingStatusIndex].count += 1;
                } else {
                    statusCounts.push(eachStatusCount);
                }
            });

            if(statusCounts.length === 1){
                orderData.status = statusCounts[0].status
                await orderData.save()
                return
            }

            let isOrderConfirmedExists = false;
            let isShippedExists = false;
            let isOutForDeliveryExists = false;
            let isDeliveredExists = false;
            let cancelledByUserCount; 
            let cancelledByAdminCount;
            let returnApprovalCount;
            let returnedCount;
            statusCounts.forEach((item) => {

                if(item.status === 'Order Confimed'){
                    isOrderConfirmedExists = true
                }

                if(item.status === 'Shipped'){
                    isShippedExists = true
                }

                if(item.status === 'Out For Delivery'){
                    isOutForDeliveryExists = true
                }

                if(item.status === 'Delivered'){
                    isDeliveredExists = true
                }

                if(item.status === 'Cancelled'){
                    cancelledByUserCount = item.count
                }

                if(item.status === 'Cancelled By Admin'){
                    cancelledByAdminCount = item.count
                }

                if(item.status === 'Pending Return Approval'){
                    returnApprovalCount = item.count
                }

                if(item.status === 'Returned'){
                    returnedCount = item.count
                }
                
            });


            if(isOrderConfirmedExists){
                orderData.status = 'Order Confirmed'
                await orderData.save()
                return
            }
            
            if(isShippedExists){
                orderData.status = 'Shipped'
                await orderData.save()
                return
            }
    
            if(isOutForDeliveryExists){
                orderData.status = 'Out For Delivery'
                await orderData.save()
                return
            }
    
    
            if(isDeliveredExists){
                orderData.status = 'Delivered'
                await orderData.save()
                return
            }

            let cancelledCount = 0;
            if(cancelledByUserCount){
                cancelledCount += cancelledByUserCount
            }
            if(cancelledByAdminCount){
                cancelledCount += cancelledByAdminCount
            }

            if(cancelledByUserCount === orderData.products.length || cancelledCount === orderData.products.length){
                orderData.status = 'Cancelled'
                await orderData.save()
                return;
            }
            
            if(cancelledByAdminCount === orderData.products.length){
                orderData.status = 'Cancelled By Admin'
                await orderData.save()
                return;
            }

            if( cancelledCount + returnApprovalCount + returnedCount === orderData.products.length){
                orderData.status = 'Pending Return Approval'
                await orderData.save()
                return;
            }
    
            if( cancelledCount + returnedCount === orderData.products.length){
                orderData.status = 'Returned'
                await orderData.save()
                return;
            }

    } catch (error) {
        next(error)
    }
}


console.log("cancel ordere");
const cancelOrder = async (req, res, next) => {
    console.log("entered to cancel order");
    try {
        const orderId = req.params.orderId;
        const cancelledBy = req.query.cancelledBy;
        const orderData = await Orders.findById({ _id: orderId });
         const userId = orderData.userId;

        let refundAmount = 0;

        if (cancelledBy === 'user') {
            for (const pdt of orderData.products) {
                if (
                    pdt.status !== 'Delivered' &&
                    pdt.status !== 'Cancelled' &&
                    pdt.status !== 'Cancelled By Admin' &&
                    pdt.status !== 'Returned'
                ) {
                    pdt.status = 'Cancelled';
                    refundAmount += pdt.totalPrice; // Assuming no discounts, coupons, or wallet deductions

                    // Incrementing Product Stock
                    await Products.findByIdAndUpdate(
                        { _id: pdt.productId },
                        {
                            $inc: {
                                quantity: pdt.quantity
                            }
                        }
                    );

                    console.log('pdt.status set to Cancelled');
                }
            }

            await orderData.save();
            await updateOrderStatus(orderId, 'Cancelled', next);
        } else if (cancelledBy === 'admin') {
            for (const pdt of orderData.products) {
                if (
                    pdt.status !== 'Delivered' &&
                    pdt.status !== 'Cancelled' &&
                    pdt.status !== 'Cancelled By Admin' &&
                    pdt.status !== 'Returned'
                ) {
                    pdt.status = 'Cancelled By Admin';
                    refundAmount += pdt.totalPrice; // Assuming no discounts, coupons, or wallet deductions

                    // Incrementing Product Stock
                    await Products.findByIdAndUpdate(
                        { _id: pdt.productId },
                        {
                            $inc: {
                                quantity: pdt.quantity
                            }
                        }
                    );
                }
            }

            await orderData.save();
            await updateOrderStatus(orderId, 'Cancelled By Admin', next);
        }

        //Updating wallet if order not COD
        if(orderData.paymentMethod !== 'COD'){
            await updateWallet(userId, refundAmount, 'Refund of Order Cancellation' )
        }

        if(cancelledBy == 'user'){
            res.redirect(`/viewOrderDetails/${orderId}`)
        }else if(cancelledBy == 'admin'){
            res.redirect('/admin/ordersList')
        }

    } catch (error) {
                next(error);
    }
}
const cancelSinglePdt = async(req, res, next) => {
    try {
        const { orderId, pdtId } = req.params
        const { cancelledBy } = req.query
        const orderData = await Orders.findById({_id: orderId})
        const userId = orderData.userId
        
        let refundAmount;
        for( const pdt of orderData.products){

            if(pdt._id == pdtId){

                if(cancelledBy == 'admin'){
                    pdt.status = 'Cancelled By Admin'
                }else if(cancelledBy == 'user'){
                    pdt.status = 'Cancelled'
                }
                
                refundAmount = pdt.totalPrice - pdt.totalDiscount;

                //Incrementing Product Stock
                await Products.findByIdAndUpdate(
                    {_id: pdt.productId},
                    {
                        $inc:{
                            quantity: pdt.quantity
                        }
                    }
                );

                break;
            }
        }

        await orderData.save()
        await updateOrderStatus(orderId, next);
        await updateWallet(userId, refundAmount, 'Refund of Order Cancellation')

        if(cancelledBy == 'admin'){
            res.redirect(`/admin/ordersList`)
        }else if(cancelledBy == 'user'){
            res.redirect(`/viewOrderDetails/${orderId}`)

        }

    } catch (error) {
        next(error)
    }
}
const returnOrder = async(req, res, next) => {
    try {

        const orderId = req.params.orderId
        const orderData = await Orders.findById({ _id: orderId })

        for (const pdt of orderData.products){

            if(pdt.status === 'Delivered' ){
                pdt.status = 'Pending Return Approval'
            }
        };

        await orderData.save()
        await updateOrderStatus(orderId, next);

        
        res.redirect(`/viewOrderDetails/${orderId}`)
        
    } catch (error) {
                next(error);
    }
}
const approveReturn = async(req,res,next) => {
    try {
        const orderId = req.params.orderId;

        const orderData = await Orders.findById({ _id: orderId })

        let refundAmount = 0;
        for (const pdt of orderData.products){

            if(pdt.status === 'Pending Return Approval' ){
                pdt.status = 'Returned'

                refundAmount = refundAmount + (pdt.totalPrice - pdt.totalDiscount)

                //Incrementing Product Stock
                await Products.findByIdAndUpdate(
                    {_id: pdt.productId},
                    {
                        $inc:{
                            quantity: pdt.quantity
                        }
                    }
                );

            }
        };

        await orderData.save()
        await updateOrderStatus(orderId, next);


        const userId = orderData.userId;

        //Adding amount into users wallet
        await updateWallet(userId, refundAmount, 'Refund of Returned Order')

        res.redirect('/admin/ordersList')
    } catch (error) {
        next(error)
    }
}



module.exports = {
    loadCheckout,
    placeOrder,
    verifyPayment,
    loadMyOrders,
    loadOrderSuccess,
    loadViewOrderDetails,
    loadAdminOrderDetails,
    loadOrdersList,
    changeOrderStatus,
    updateOrderStatus,
    cancelOrder,
    cancelSinglePdt,
    returnOrder,
    approveReturn
};
