const Categories = require('../models/categoryModel');
const Products = require('../models/productModel');


const loadCategories = async (req, res, next) => {
    try {
        const categories = await Categories.find();
        res.render('categories', { categories, page: 'Categories' });
    } catch (error) {
        next(error);
    }
}


const addCategory = async (req, res, next) => {
    try {
        const categoryName = req.body.categoryName.toUpperCase();
        const categoryImage = req.file;

        // Client-side validation
        if (!validateCategoryName(categoryName)) {
            console.log('Invalid Category Name');
            return res.redirect('/admin/categories');
        }

        const isExistCategory = await Categories.findOne({ name: categoryName });

        if (isExistCategory) {
            console.log('Category Already Exists');
            return res.redirect('/admin/categories');
        } else {
            // Assuming req.file is the uploaded category image
            if (!categoryImage) {
                console.log('Please upload an image for the category');
                return res.redirect('/admin/categories');
            }

            const image = categoryImage.filename;

            await new Categories({ name: categoryName, image }).save();
            console.log('Category added successfully');
            return res.redirect('/admin/categories');
        }
    } catch (error) {
        next(error);
    }
}

// Client-side validation function
function validateCategoryName(categoryName) {
    const trimmedName = categoryName.trim();

    if (trimmedName.length === 0) {
        // You can customize error messages or logging here
        console.log('Enter a valid Category Name');
        return false;
    }

    return true;
}


const editCategory = async (req, res, next) => {
    try {
        console.log('on edit category controller its working!');
        const id = req.body.categoryId
        const newName = req.body.categoryName.toUpperCase()

        const isCategoryExist = await Categories.findOne({ name: newName })

        if (req.file) {
            const image = req.file.filename
            if (!isCategoryExist || isCategoryExist._id == id) {
                await Categories.findByIdAndUpdate({ _id: id }, { $set: { name: newName, image: image } })
            }
        } else {
            if (!isCategoryExist) {
                await Categories.findByIdAndUpdate({ _id: id }, { $set: { name: newName } })
            }
        }

        res.redirect('/admin/categories')
    } catch (error) {
        next(error);
    }
}

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
}

module.exports = {
    loadCategories,
    addCategory,
    editCategory,
    listCategory
}
