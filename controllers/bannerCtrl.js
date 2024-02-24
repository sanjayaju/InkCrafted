const fs = require('fs')
const path = require('path')
const Banners = require('../models/bannerModal');


const loadBannerList = async(req, res, next) => {
    try {

        const bannerLimit = 3;
        const banners = await Banners.find({})
        res.render('banner',{page:'Banners', banners, bannerLimit})
    } catch (error) {
        next(error)
    }
}


 
const addBanner = async(req, res, next) => {
    try {
        const { heading, url } = req.body;
        const image = req.file.filename

        await new Banners({
            heading, url, image
        }).save();

        res.redirect('/admin/banners')
        
    } catch (error) {
        next(error)
    }
}





module.exports={
    loadBannerList,
    addBanner
}