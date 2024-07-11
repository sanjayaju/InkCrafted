const Categories = require('../models/categoryModel');
const Products = require('../models/productModel');
const Offers = require('../models/offerModel');

const loadCategories = async (req, res, next) => {
    try {
        const categories = await Categories.find({}).populate('offer');
        const offerData = await Offers.find({ $or: [
            { status: 'Starting Soon' },
            { status: 'Available' }
        ]});
        res.render('categories', { categories, page: 'Categories', offerData });
    } catch (error) {
        next(error);
    }
};

const addCategory = async (req, res, next) => {
    try {
        const categoryName = req.body.categoryName.toUpperCase();

        // Client-side validation
        if (!validateCategoryName(categoryName)) {
            console.log('Invalid Category Name');
            return res.redirect('/admin/categories');
        }

        const isExistCategory = await Categories.findOne({ name: categoryName });

        if (isExistCategory) {
            console.log('Category Already Exists');
            return res.redirect('/admin/categories');
        }

        await new Categories({ name: categoryName }).save();
        console.log('Category added successfully');
        return res.redirect('/admin/categories');
    } catch (error) {
        next(error);
    }
};

// Client-side validation function
function validateCategoryName(categoryName) {
    const trimmedName = categoryName.trim();

    if (trimmedName.length === 0) {
        console.log('Enter a valid Category Name');
        return false;
    }

    return true;
}

const editCategory = async (req, res, next) => {
    try {
        console.log('on edit category controller its working!');
        const id = req.body.categoryId;
        const newName = req.body.categoryName.toUpperCase();

        const isCategoryExist = await Categories.findOne({ name: newName });

        if (!isCategoryExist || isCategoryExist._id == id) {
            await Categories.findByIdAndUpdate({ _id: id }, { $set: { name: newName } });
        }

        res.redirect('/admin/categories');
    } catch (error) {
        next(error);
    }
};

const listCategory = async (req, res, next) => {
    try {
        const id = req.params.id;
        const categoryData = await Categories.findById({ _id: id });

        if (categoryData) {
            categoryData.isListed = !categoryData.isListed;
            await categoryData.save();

            // Update related products when listing/unlisting a category
            await Products.updateMany({ categoryId: id }, { $set: { isListed: categoryData.isListed } });
        }

        res.redirect('/admin/categories');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    loadCategories,
    addCategory,
    editCategory,
    listCategory
};
