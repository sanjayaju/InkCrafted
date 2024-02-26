const Products = require('../models/productModel')
const Categories = require('../models/categoryModel');
const User = require('../models/userModel')
const Orders =  require('../models/orderModel')
const fs = require('fs')
const path = require('path')





const loadProduct = async (req, res, next) => {
    try {
        const pdtsData = await Products.find().populate("category");
        console.log('pdtsData',pdtsData);
        res.render('products', { pdtsData, page: 'Products' });
    } catch (error) {
        next(error);
    }
}


const loadAddProduct = async(req, res, next) => {
    try {
        const categories = await Categories.find({ isListed: true })
        res.render('addProduct',{categories, page:'Products'})
    } catch (error) {
                next(error);
    } 
}

const addProductDetails = async (req, res, next) => {
    try {
        const {
            brand, productName, category,
            InkColor, quantity, price, description,
        } = req.body;

        console.log(req.files);

        let images = [];
        for (let file of req.files) {
            images.push(file.filename);
        }

        console.log('Category Name1:', category);
        
        // Use findOne instead of find to get a single category
        const catData = await Categories.findOne({ name: category.trim() });

        console.log(catData);
        if (!catData) {
            return res.status(400).json({ error: 'Invalid category', category: req.body.category });
        }

        console.log('Category Name:', category);

        const prodData = await new Products({
            brand,
            name: productName,
            description,
            category: catData._id,
            InkColor: req.body.InkColor, 
            price,
            quantity,
            images,
            createdAt: new Date(),
        }).save();
        
        res.redirect('/admin/products');
        
    } catch (error) {
        next(error);
    }
};

const loadEditProduct = async(req, res, next) => {
    try {
        const id = req.params.id;
        const pdtData = await Products.findById({ _id: id }).populate('category');
        const catData = await Categories.find({ isListed: true });

        res.render('editProduct', { pdtData, catData, page: 'Products' });

    } catch (error) {
        next(error);
    }
}

const postEditProduct  = async(req,res,next)=>{
    try{
        const { id, productName, category, inkColor, quantity, price, description } = req.body;

        const brand = req.body.brand.toUpperCase()

        if (req.files){
            let newImages = []
            for (let file of req.files){
                newImages.push(file.filename)
            }
            console.log('id : '+id);
            console.log('Before findOneAndUpdate');
            await Products.findOneAndUpdate({_id:id},{$push:{images:{$each:newImages}}})
            console.log('After findOneAndUpdate');


        }
        console.log('category :'+category);
        const catData = await Categories.findOne({name:category})
        console.log(catData);
        await Products.findByIdAndUpdate(
            { _id: id },
            {
               $set: {
                  brand,
                  name: productName,
                  category: catData._id,
                  quantity,
                  description,
                  price,
                  InkColor: inkColor, 
               },
            }
         )
         console.log('Product updated successfully');
        res.redirect('/admin/products')
        console.log("NOt updated ");
    }catch (error){
        next(error);
    }
}

const deleteProduct = async(req,res,next)=>{
    try{
        const id =  req.params.id;
        const prodData = await Products.findById({_id:id})
        prodData.isListed =!prodData.isListed
        prodData.save()
            res.redirect('/admin/products');
    }catch(error){
        next(error);
    }
}

const deleteImage = async(req,res,next)=>{
    try{
        const id = req.params.id;
        const imageURL = req.query.imageURL;

        await Products.findOneAndUpdate({_id:id}, {$pull:{images:imageURL}})

        console.log('imageURL : '+imageURL+'type : ' +typeof imageURL);

        const imgFolder = path.join(__dirname,'../public/images/productImages')

        const files = fs.reddirSync(imgFolder);

        for(const file of files ){
            if(file === imageURL){
                const filePath = path.join(imgFolder,file);
                fs.unlinkSync(filePath);
                break;
            }
        }

        res.redirect(`/admin/products/editProduct/${id}`);
    }catch (error){
        next(error);
    }
}
const loadShop = async (req, res, next) => {
    try {
        const isLoggedIn = Boolean(req.session.userId);
        let cart = [];

        let page = req.query.page || 1;
        let limit = 6;

        let minPrice = req.query.minPrice && parseInt(req.query.minPrice) ? parseInt(req.query.minPrice) : 1;
        let maxPrice = req.query.maxPrice && parseInt(req.query.maxPrice) ? parseInt(req.query.maxPrice) : Number.MAX_VALUE;

        console.log("searching");
        console.log('Request Query Parameters:', req.query);
        console.log("Search Parameter from Request:", req.query.search);

        let search = req.query.search || '';
        
        console.log("Search Query:", search);

        async function getCategoryIds(search) {
            const categories = await Categories.find({
                name: {
                    $regex: '.*' + search + '.*',
                    $options: 'i'
                }
            });
            const categoryIds = categories.map(category => category._id);
            console.log('Category IDs:', categoryIds);
            return categoryIds;
        }

        const query = {
            isListed: true,
            $or: [
                {
                    name: {
                        $regex: '.*' + search + '.*',
                        $options: 'i',
                    },
                },
                {
                    brand: {
                        $regex: '.*' + search + '.*',
                        $options: 'i',
                    },
                },
            ],
            price: {
                $gte: minPrice,
                $lte: maxPrice,
            },
        };

        let inkColor = req.query.inkColor;
        if (inkColor) {
            inkColor = inkColor.toLowerCase();
            query.InkColor = { $regex: inkColor, $options: 'i' };
        }

        if (search) {
            query.$or.push({
                category: {
                    $in: await getCategoryIds(search),
                },
            });
        }

        console.log('Constructed Query:', query);

        if (req.query.category) {
            query.category = req.query.category;
        }

        if (req.query.brand) {
            query.brand = req.query.brand;
        }

        let sortValue = req.query.sortValue || 1;

        let pdtsData;
        if (sortValue == 1) {
            pdtsData = await Products.find(query)
                .populate('category')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);
        } else {
            pdtsData = await Products.find(query)
                .populate('category');

            pdtsData.forEach((pdt) => {
                pdt.actualPrice = pdt.price;
            });

            if (sortValue == 2) {
                pdtsData.sort((a, b) => {
                    return a.actualPrice - b.actualPrice;
                });
            } else if (sortValue == 3) {
                pdtsData.sort((a, b) => {
                    return b.actualPrice - a.actualPrice;
                });
            }

            pdtsData = pdtsData.slice((page - 1) * limit, page * limit);
            console.log('Sorted and Paginated pdtsData:', pdtsData);
        }

        const categoryNames = await Categories.find({});
        const brands = await Products.aggregate([
            {
                $group: {
                    _id: '$brand',
                },
            },
        ]);

        let totalProductsCount = await Products.find(query).count();
        let pageCount = Math.ceil(totalProductsCount / limit);

        let removeFilter = req.query && !req.query.page ? 'true' : 'false';

        let userData;
        let wishlist;

        if (req.session.userId) {
            userData = await User.findById({ _id: req.session.userId })
            wishlist = userData.wishlist;
            cart = userData.cart.map(item => item.productId.toString())
        }

        res.render('shop', {
            pdtsData,
            userId: req.session.userId,
            categoryNames,
            brands,
            pageCount,
            currentPage: page,
            sortValue,
            minPrice: req.query.minPrice,
            maxPrice: req.query.maxPrice,
            category: req.query.category,
            brand: req.query.brand,
            removeFilter,
            search,
            inkColor,
            pageTitle: 'Shop',
            wishlist,
            cart,
            isLoggedIn,
            page: 'Shop',
        });
    } catch (error) {
        console.error('Error:', error);
        next(error);
    }
};


const loadProductOverview = async (req, res, next) => {
    try {
        const id = req.params.id;
        const userId = req.session.userId;
        const isLoggedIn = Boolean(userId);
        const pdtData = await Products.findById({ _id: id }).populate('reviews.userId');

        let isPdtExistInCart = false;
        let isPdtAWish = false;
        let isUserReviewed = false;

        if (userId) {
            const userData = await User.findById({ _id: userId });
            const wishlist = userData.wishlist;

            if (wishlist.find((productId) => productId == id)) {
                isPdtAWish = true;
            }

            userData.cart.forEach((pdt) => {
                if (pdt.productId == id) {
                    isPdtExistInCart = true;
                }
            });

            pdtData.reviews.forEach((review) => {
                if (review.userId._id == userId) {
                    isUserReviewed = true;
                }
            });
        }

        // Calculate current price without discountPrice and offerPrice
        const currPrice = pdtData.price;

        const discountPercentage = Math.floor(100 - ((currPrice * 100) / pdtData.price));

        res.render('productOverview', {
            pdtData,
            parentPage: 'Shop',
            page: 'Product Overview',
            isLoggedIn,
            isPdtAWish,
            isPdtExistInCart,
            isUserReviewed,
            currPrice,
            discountPercentage,
        });
    } catch (error) {
        next(error);
    }
};

const loadAddReview = async(req, res, next) => {
    try {
        const { productId } = req.params
        const { userId } = req.session
        let isPdtPurchased = false
        const isLoggedIn = Boolean(req.session.userId)
        const orderData = await Orders.findOne({ userId, 'products.productId': productId })
        if(orderData) isPdtPurchased = true

        res.render('addReview',{page:'Reviews', parentPage:'Shop',isPdtPurchased, productId, userId, isLoggedIn})
    } catch (error) {
        next(error)
    }
}

const postAddReview = async(req, res, next) => {
    try {
        const { productId } = req.params
        const { userId } = req.session
        const { rating, title, description } = req.body

        await Products.updateOne(
            {_id:productId},
            {
                $push:{
                    reviews:{
                        userId, title, rating, description, createdAt: new Date()
                    }
                }
            }
        );

        const pdtData = await Products.findById({_id:productId})
        const totalRating = pdtData.reviews.reduce((sum, review) => sum += review.rating, 0)
        const avgRating = Math.floor(totalRating/pdtData.reviews.length)

        await Products.updateOne(
            {_id:productId},
            {
                $set:{
                    totalRating: avgRating
                }
            }
        );

        res.redirect(`/shop/productOverview/${productId}`)
    } catch (error) {
        next(error)
    }
}

const loadEditReview = async(req, res, next) => {
    try {
        const { productId } = req.params
        const { userId } = req.session;
        const isLoggedIn = Boolean(userId)
        const pdtData = await Products.findOne(
            {
                _id:productId,
                reviews:{
                    $elemMatch: { userId }
                }
            }
        ).populate('reviews.userId');

        const reviewData = pdtData.reviews.find((review) => review.userId._id == userId)
        res.render('editReview',{ reviewData, productId, isLoggedIn, page:'Edit Review', parentPage: 'Shop' })
    } catch (error) {
        next(error)
    }
}

const postEditReview = async(req, res, next) => {
    try {

        const { productId } = req.params
        const { reviewId }  = req.query
        const { rating, title, description } = req.body

        await Products.updateOne(
            {_id:productId, 'reviews._id': reviewId },
            {
                $set:{
                    'reviews.$.rating' : rating,
                    'reviews.$.title' : title,
                    'reviews.$.description' : description
                }
            }
        );
        
        const pdtData = await Products.findById({_id:productId})
        const totalRating = pdtData.reviews.reduce((sum, review) => sum += review.rating, 0)
        const avgRating = Math.floor(totalRating/pdtData.reviews.length)

        await Products.updateOne(
            {_id:productId},
            {
                $set:{
                    totalRating: avgRating
                }
            }
        );
        
        res.redirect(`/shop/productOverview/${productId}`)
    } catch (error) {
        next(error)
    }
}


const loadAllReviews = async(req, res, next) => {
    try {
        const { productId } = req.params
        const { userId } = req.session
        const isLoggedIn = Boolean(userId)
        const pdtData = await Products.findById({_id: productId})
        res.render('showReviews',{pdtData, userId, page:'Reviews', parentPage:'Shop', isLoggedIn})
    } catch (error) {
        next(error)
    }
}



module.exports = {
    loadProduct,
    loadAddProduct,
    addProductDetails,
    loadEditProduct,
    postEditProduct,
    deleteProduct,
    deleteImage,
    loadShop,
    loadProductOverview,
    loadAddReview,
    postAddReview,
    loadEditReview,
    postEditReview,
    loadAllReviews
}

