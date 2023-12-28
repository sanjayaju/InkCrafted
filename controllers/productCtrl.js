const Products = require('../models/productModel')
const Categories = require('../models/categoryModel');
const User = require('../models/userModel')





const loadProduct = async (req, res, next) => {
    try {
        const pdtsData = await Products.find().populate("category");

        res.render('products', { pdtsData, page: 'Products' });
    } catch (error) {
        next(error);
    }
}


const loadAddProduct = async( req, res, next) => {
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

        const catData = await Categories.findOne({ name: category });

        if (!catData) {
            // Handle the case where the category doesn't exist
            return res.status(400).send('Invalid category');
        }
        
        const prodData = await new Products({
            brand,
            name: productName,
            description,
            category: catData._id,
            inkColor: 'Black',
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
        const{
            id,productName,category,InkColor,quantity,price,description,
        } = req.body

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
            {_id:id},
         {
            $set: {
                brand, name: productName, category: catData._id, quantity,
                description, price, inkColor: InkColor,
            }
         }   
        )
        console.log("hai");
        res.redirect('/admin/products')
        console.log("no hai");
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
        let sortValue = 1;
        let page = 1;
        if (req.query.page) {
            page = req.query.page;
        }

        let limit = 6;

        const query = {
    
        };

        if (req.query.category) {
            query.category = req.query.category;
        }

        const pdtsData = await Products.find(query)
            .populate('category')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Use aggregation to get distinct brands
        const distinctBrands = await Products.aggregate([
            { $match: query },
            { $group: { _id: '$brand' } },
            { $project: { _id: 0, brand: '$_id' } },
        ]);

        const categoryNames = await Categories.find({});

        let cart = [];
        if (isLoggedIn) {
            const userData = await User.findById({ _id: req.session.userId });
            if (userData) {
                cart = userData.cart.map((item) => item.productId.toString());
            }
        }

        res.render('shop', {
            pdtsData,
            userId: req.session.userId,
            categoryNames,
            brands: distinctBrands,  // Use distinctBrands instead
            pageCount: Math.ceil(pdtsData.length / limit),
            currentPage: page,
            sortValue,
            category: req.query.category,
            brand: req.query.brand,
            page: 'Shop',
            cart,
            isLoggedIn,
        });
    } catch (error) {
        next(error);
    }
};
const loadProductOverview = async (req, res, next) => {
    try {
        const id = req.params.id;
        const userId = req.session.userId;
        const isLoggedIn = Boolean(userId);
        const pdtData = await Products.findById({ _id: id });

        let isPdtExistInCart = false;
        let userData; // Define userData outside the try block

        if (userId) {
            // Fetch user data and assign it to the userData variable
            userData = await User.findById({ _id: userId });

            // Check if userData is defined before using forEach
            if (userData && userData.cart) {
                userData.cart.forEach((pdt) => {
                    if (pdt.productId == id) {
                        isPdtExistInCart = true;
                    }
                });
            }
        }

        let currPrice = pdtData.price; // Assuming no offer price

        res.render('productOverview', {
            pdtData,
            parentPage: 'Shop',
            page: 'Product Overview',
            isLoggedIn,
            isPdtExistInCart,
            currPrice,
            cart: userData ? userData.cart : [], // Use userData here
        });
    } catch (error) {
        next(error);
    }
};



module.exports = {
    loadProduct,
    loadAddProduct,
    addProductDetails,
    loadEditProduct,
    postEditProduct,
    deleteProduct,
    deleteImage,
    loadShop,
    loadProductOverview
}

