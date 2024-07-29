const fs = require('fs');
const path = require('path');
const Banners = require('../models/bannerModal');

const loadBannerList = async (req, res, next) => {
    try {
        const bannerLimit = 3;
        const banners = await Banners.aggregate([
            { $sample: { size: bannerLimit } }
        ]);

        res.render('banner', { page: 'Banners', banners, bannerLimit });
    } catch (error) {
        next(error);
    }
};

const addBanner = async (req, res, next) => {
    try {
        const { heading, url } = req.body;
        const image = req.file.filename;

        await new Banners({
            heading, url, image
        }).save();

        res.redirect('/admin/banners');
    } catch (error) {
        next(error);
    }
};

const UpdateBanner = async (req, res, next) => {
    try {
        const bannerId = req.params.bannerId;
        const { heading, url } = req.body;
        let image = false;

        if (req.file) {
            image = req.file.filename;
        }

        const bannerData = await Banners.findById({ _id: bannerId });

        if (image) {
            const oldImagePath = path.join(__dirname, '../public/images/bannerImages/', bannerData.image);

            if (fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, async (err) => {
                    if (err) {
                        return next(err);
                    }

                    await Banners.findByIdAndUpdate(
                        { _id: bannerId },
                        { $set: { heading, image, url } }
                    );

                    res.redirect('/admin/banners');
                });
            } else {
                console.log('File does not exist:', oldImagePath);
                await Banners.findByIdAndUpdate(
                    { _id: bannerId },
                    { $set: { heading, image, url } }
                );

                res.redirect('/admin/banners');
            }
        } else {
            await Banners.findByIdAndUpdate(
                { _id: bannerId },
                { $set: { heading, url } }
            );

            res.redirect('/admin/banners');
        }
    } catch (error) {
        next(error);
    }
};

const deleteBanner = async (req, res, next) => {
    try {
        const bannerId = req.params.bannerId;
        const bannerData = await Banners.findById({ _id: bannerId });
        const imagePath = path.join(__dirname, '../public/images/bannerImages/', bannerData.image);

        if (fs.existsSync(imagePath)) {
            fs.unlink(imagePath, async (err) => {
                if (err) {
                    return next(err);
                }

                await Banners.findByIdAndDelete({ _id: bannerId });
                res.redirect('/admin/banners');
            });
        } else {
            console.log('File does not exist:', imagePath);
            await Banners.findByIdAndDelete({ _id: bannerId });
            res.redirect('/admin/banners');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    loadBannerList,
    addBanner,
    UpdateBanner,
    deleteBanner
};
