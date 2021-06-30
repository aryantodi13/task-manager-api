const express = require('express')
const Task = require('../models/task')
const router = new express.Router()
const auth = require('../middleware/auth')

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body, 
        ownerID: req.user._id
    })
    
    try{
        await task.save();
        res.status(201).send(task);
    }
    catch(e){
        res.status(400).send(e);
    }
})

router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}
    if(req.query.completed) match.completed = (req.query.completed === 'true');

    if(req.query.sortBy){
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1]==='desc'? -1: 1;
    }
    try{
        // const tasks = await Task.find({ownerID: req.user._id})
        // res.send(tasks);
        await req.user.populate({
            path: 'tasks', 
            match, 
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks);
    }
    catch(e){
        res.status(500).send(e);
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    var _id = req.params.id;
    try{
        const task = await Task.findOne({_id, ownerID: req.user._id});
        if(!task) return res.status(404).send();
        res.send(task);
    }
    catch(e){
        res.status(500).send();
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    var _id = req.params.id;
    const allowed = ['description', 'completed'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) => allowed.includes(update));

    if(!isValidOperation) return res.status(400).send({error: 'Invalid update'});

    try{
        const task = await Task.findOne({
            _id, 
            ownerID: req.user._id
        });
        if(!task) return res.status(404).send({error:'No task found.'})
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task);
    }
    catch(e){
        res.status(400).send(e);
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try{
        const task = await Task.findOne({
            _id, 
            ownerID: req.user._id
        })
        if(!task) return res.status(404).send({error: 'Not found'});
        await task.remove()
        res.send(task);
    }
    catch(e){
        res.status(500).send();
    }
})

module.exports = router;