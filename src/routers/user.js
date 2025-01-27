const express = require('express');
const sharp = require('sharp');
const multer = require('multer')
const User = require('../models/user');
const router = new express.Router();
const auth = require('../middleware/auth');
const {sendWelcomeEmail, sendCancellationEmail} = require('../emails/account');

//Create user
router.post('/users',async (req, res) => {
    const user = new User(req.body);
    try{
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({user, token});
    } catch(e) {
        res.status(400).send(e);
    }
})

//Login
router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken();
        res.send({user, token});
    }
    catch(e){
        res.status(400).send(e);
    }
})

//Logout
router.post('/users/logout', auth, async( req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)

        await req.user.save();
        res.send();
    }
    catch(e){
        res.status(500).send();
    }
})

//Logout of all sessions
router.post('/users/logoutAll', auth, async( req, res) => {
    try{
        req.user.tokens = []

        await req.user.save();
        res.send();
    }
    catch(e){
        res.status(500).send();
    }
})

//Profile pic upload
const upload = multer({
    limits: {
        fileSize: 1000000
    }, 
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|png|jpeg)$/)){
            return cb(new Error('Upload Image File'));
        }
        cb(undefined, true);
    }
})
router.post('/users/me/avatar', auth, upload.single('avatar'), async(req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

//Read profile
router.get('/users/me', auth,  async (req, res) => {
    res.send(req.user);
})

//View profile pic
router.get('/users/:id/avatar', async (req, res) => {
    try{
        const user = await User.findById(req.params.id);
        if(!user || !user.avatar) throw new Error();
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    }
    catch(e){
        res.status(404).send();
    }
})

//Update profile
router.patch('/users/me', auth, async (req, res) => {
    const allowed = ['name', 'email', 'password', 'age'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) => allowed.includes(update))
    if(!isValidOperation){
        return res.status(400).send({error:'Invalid Updates '})
    }
    try{
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save();
        res.send(req.user);
    }
    catch(e){
        res.status(400).send(e);
    }
})

//Delete profile pic
router.delete('/users/me/avatar', auth, async (req, res) => {
    try{
        if(!req.user.avatar) return res.status(404).send();
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    }
    catch(e){
        res.status(400).send();
    }
})

//Delete user
router.delete('/users/me', auth, async (req, res) => {
    try{
        sendCancellationEmail(req.user.email, req.user.name);
        await req.user.remove()
        res.send(req.user);
    }
    catch(e){
        res.status(400).send(e);
    }
})

module.exports = router