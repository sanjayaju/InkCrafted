const Admin = require('../models/adminModel');
 const User = require('../models/userModel');
 const bcryptjs = require('bcryptjs')
 const Orders  = require('../models/orderModel');
 const { getMonthName } = require('../helpers/helpersFunctions')
const { findIncome, countSales, findSalesData, findSalesDataOfYear, findSalesDataOfMonth, formatNum } = require('../helpers/orderHelper')


const loadDashboard = async(req,res, next) => {
    try {
        //Setting Dates Variables
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const jan1OfTheYear =  new Date(today.getFullYear(), 0, 1);
        
        const totalIncome = await findIncome()
        const thisMonthIncome = await findIncome(firstDayOfMonth)
        const thisYearIncome = await findIncome(jan1OfTheYear)

        const totalUsersCount = formatNum(await User.find({}).count()) 
        const usersOntheMonth = formatNum(await User.find({ createdAt:{ $gte: firstDayOfMonth }}).count()) 

        const totalSalesCount = formatNum(await countSales()) 
        const salesOnTheYear = formatNum(await countSales(jan1OfTheYear)) 
        const salesOnTheMonth = formatNum(await countSales(firstDayOfMonth)) 
        const salesOnPrevMonth = formatNum(await countSales( firstDayOfPreviousMonth, firstDayOfPreviousMonth ))
        
        let salesYear = 2023;
        if(req.query.salesYear){
            salesYear = parseInt(req.query.salesYear)
        }

        if(req.query.year){
            salesYear = parseInt(req.query.year)
            displayValue = req.query.year
            xDisplayValue = 'Months'
        }

        let monthName = ''
        if(req.query.month){
            salesMonth = 'Weeks',
            monthName = getMonthName(req.query.month)
            displayValue = `${salesYear} - ${monthName}`
        }

        const totalYears = await Orders.aggregate([
            { $group: { _id: { createdAt:{ $dateToString: {format: '%Y', date: '$createdAt'}}}}},
            { $sort: {'_id:createdAt': -1 }}
        ]);

        const displayYears = [];  //use map if possible
        // console.log(totalYears);
        totalYears.forEach((year) => {
            displayYears.push(year._id.createdAt)
        });

        let orderData;
        if(req.query.year && req.query.month){
            orderData = await findSalesDataOfMonth( salesYear, req.query.month )
        }else if(req.query.year && !req.query.month){
            orderData = await findSalesDataOfYear(salesYear)
        }else{
            orderData = await findSalesData()
        }

        let months = []
        let sales = []

        if(req.query.year && req.query.month){

            orderData.forEach((year) => { months.push(`Week ${year._id.createdAt}`) })
            orderData.forEach((sale) => { sales.push(Math.round(sale.sales)) })

        }else if(req.query.year && !req.query.month){

            orderData.forEach((month) => {months.push(getMonthName(month._id.createdAt))})
            orderData.forEach((sale) => { sales.push(Math.round(sale.sales))})

        }else{

            orderData.forEach((year) => { months.push(year._id.createdAt) })
            orderData.forEach((sale) => { sales.push(Math.round(sale.sales)) })

        }

        let totalSales = sales.reduce((acc,curr) => acc += curr , 0)

        // category sales
        let categories = []
        let categorySales = []
        const categoryData = await Orders.aggregate([
                    { $match: { status: 'Delivered' } },
                    {
                        $unwind: '$products'
                    },
                    {
                        $lookup: {
                            from: 'products', // Replace 'products' with the actual name of your products collection
                            localField: 'products.productId',
                            foreignField: '_id',
                            as: 'populatedProduct'
                        }
                    },
                    {
                        $unwind: '$populatedProduct'
                    },
                    {
                        $lookup: {
                            from: 'categories', // Replace 'categories' with the actual name of your categories collection
                            localField: 'populatedProduct.category',
                            foreignField: '_id',
                            as: 'populatedCategory'
                        }
                    },
                    {
                        $unwind: '$populatedCategory'
                    },
                    {
                        $group: {
                            _id: '$populatedCategory.name', sales: { $sum: '$totalPrice' } // Assuming 'name' is the field you want from the category collection
                        }
                    }
        ]);

        categoryData.forEach((cat) => {
            categories.push(cat._id),
            categorySales.push(cat.sales)
        })

        let paymentData = await Orders.aggregate([
            { $match: { status: 'Delivered', paymentMethod: { $exists: true } }},
            { $group: { _id: '$paymentMethod', count: { $sum: 1 }}}
        ]);

        console.log(paymentData);

        let paymentMethods = []
        let paymentCount = []
        paymentData.forEach((data) => {
            paymentMethods.push(data._id)
            paymentCount.push(data.count)
        })

        let orderDataToDownload = await Orders.find({ status: 'Delivered' }).sort({ createdAt: 1 })
        if(req.query.fromDate && req.query.toDate){
            const { fromDate, toDate } = req.query
            orderDataToDownload = await Orders.find({ status: 'Delivered', createdAt: { $gte: fromDate, $lte: toDate }}).sort({ createdAt: 1 })

        }

        res.render('dashboard',{
                page : 'Dashboard',
                totalUsersCount, 
                usersOntheMonth,
                totalSales,
                totalSalesCount,
                salesOnTheYear,
                totalIncome,
                thisMonthIncome,
                thisYearIncome,
                sales, 
                months, 
                salesYear, 
                displayYears,
                categories,
                categorySales,
                paymentMethods,
                paymentCount,
                orderDataToDownload,
                salesOnTheMonth,
                salesOnPrevMonth
        })


    } catch (error) {
        next(error)
    }
}



const loadAdminLogin = async(req,res, next) => {
    try {
        res.render('login')
    } catch (error) {
        next(error)
    }
}

const verifyAdminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log('Received login request for email:', email);

        const adminData = await Admin.findOne({ email });
        console.log('Retrieved admin data:', adminData);

        if (adminData) {
            const passwordMatch = await bcryptjs.compare(password, adminData.password);
            console.log('Password match:', passwordMatch);

            if (passwordMatch) {
                req.session.adminId = adminData._id;
                res.redirect('/admin');
            } else {
                console.log('Invalid Password');
            }
        } else {
            console.log("This email doesn't exist");
        }
    } catch (error) {
        console.error('Error in verifyAdminLogin:', error);
        next(error);
    }
};

const logoutAdmin = async(req,res, next) => {
    try {
        req.session.adminId = null
        res.redirect('/admin')
    } catch (error) {
        next(error)
    }
}
// const loadDashboard = async (req, res, next) => {
//     try {
//         if (req.session.adminId) {
//             res.render('dashboard', { page: 'Dashboard' });
//         } else {
//             // Handle the case when the admin is not logged in
//             res.redirect('/admin/login');
//         }
//     } catch (error) {
//         next(error);
//     }
// }

    
const loadUsers = async(req,res, next) => { 
    try {
        const userData = await User.find({}).sort({createdAt : -1})
        res.render('users',{userData, page: 'Users'})
    } catch (error) {
        next(error)
    }
}
const blockUser = async(req,res, next) => {
    try {
        
        const id = req.params.id
        const user = await User.findById({_id:id})
        user.isBlocked = !user.isBlocked
        await user.save()

        res.redirect('/admin/users')
    } catch (error) {
        next(error)
    }
}




module.exports = {
    loadAdminLogin,
    verifyAdminLogin,
    logoutAdmin,
    loadDashboard,
    loadUsers,
    blockUser 
}