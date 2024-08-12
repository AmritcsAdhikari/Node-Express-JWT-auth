import express from 'express'
import {body, validationResult} from 'express-validator';
import gravatar from "gravatar"
import bcrypt from "bcryptjs"
import jwt from 'jsonwebtoken'
import User from "../schemas/UserSchema.js"
import { tokenVerifier } from '../middleware/tokenVerifier.js';


const userRouter = express.Router();

/**
 * @usage : Register a User
 * @url : http://localhost:9090/users/register
 * @params : username,email,password
 * @method : POST
 * @access : PUBLIC
 */
userRouter.post('/register',[
    body('username').not().isEmpty().withMessage('Username is required.'),
    body('email').isEmail().withMessage('Email is required.'),
    body('password').not().isEmpty().withMessage('Password is required.'),
], async(req,res)=>{

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(401).json({
            
            msg: errors.array().map(error => error.msg).join(',\n'),
            data: null,
            status: 'FAILED'
        })
    }

    try{
        //read the data from the req obj
        let {username, email, password} = req.body

        let userObj = await User.findOne({email:email})

        if(userObj){
            return res.status(401).json({
                msg: 'User Already exists',
                data: null,
                status: 'FAILED'
            })
        }
        
        //get the avatar url
        let imageUrl = gravatar.url(email,{
            size: '200',
            rating: 'pg',
        })

        const isAdmin= false;

        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(password,salt)
        console.log(hashPassword);

        let newUser = {
            username: username,
            email: email,
            password: hashPassword,
            imgUrl: imageUrl,
            isAdmin: isAdmin
        }

        let user = await new User(newUser).save()
        if(user){
            return res.status(201).json({
                msg: 'User Registration success!',
                data: null,
                status: 'SUCCESS'
            })
        }

    }catch(error){
        console.log(error);
        return res.status(500).json({
            msg: `Server Error - ${error.message}`,
            data: null,
            status: 'FAILED'
        })
    }
});


/**
 * @usage : Login a User
 * @url : http://localhost:9090/users/login
 * @params : email,password
 * @method : POST
 * @access : PUBLIC
 */
userRouter.post('/login',[
    body('email').isEmail().withMessage('Email is required.'),
    body('password').not().isEmpty().withMessage('Password is required.'),
], async(req,res)=>{

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(401).json({
            msg: errors.array().map(error => error.msg).join(',\n'),
            data: null,
            status: 'FAILED'
        })
    }

    try{

        //read the data from the req obj
        let {email, password} = req.body

        let userObj = await User.findOne({email:email})

        if(!userObj){
            return res.status(401).json({
                msg: 'User Not Found!',
                data: null,
                status: 'FAILED'
            })
        }   

        let isMatch = await bcrypt.compare(password,userObj.password)

        if(!isMatch){
            return res.status(401).json({
                msg: 'Invalid password',
                data: null,
                status: 'FAILED'
            })
        }

        // IMPORTANT - generate token and send
        let payload = {
            id: userObj._id,
            email: userObj.email
        }
        let secretKey = process.env.EXPRESS_APP_JWT_SECRET_KEY;

        let {username,_id,createdAt,imgUrl,isAdmin} = userObj

        if(payload && secretKey){
            let token = jwt.sign(payload,secretKey, {expiresIn: '86400', algorithm: 'HS256'})

            return res.status(200).json({
                msg: 'Login success',
                token: token,
                data: {email,username,_id,createdAt,imgUrl,isAdmin}
            })
        }
    }catch(error){
        console.log(error);
        return res.status(500).json({
            msg: `Server Error - ${error.message}`,
            data: null,
            status: 'FAILED'
        })
    }
})


/**
 * @usage : Get users Data
 * @url : http://localhost:9090/users/me
 * @method : GET
 * @access : PRIVATE
 */
userRouter.get('/me',tokenVerifier,async(req,res)=>{

    try{

        let payload = req.headers['user']
        let {id} = payload
        if(!id){
            return res.status(401).json({
                msg: 'Invalid User Request!'
            })
        }
        
        let userObj = await User.findById(id);

        let {email,username,_id,createdAt,imgUrl,isAdmin} = userObj

        let data = {
            _id,
            email,
            username,
            createdAt,
            imgUrl,
            isAdmin
        }

        return res.status(200).json({
            user: data,
            msg: 'Success'
        })

    }catch(error){
        console.log(error);
        return response.status(500).json({
            msg: 'Server Error',
            data: null,
            status: APP_CONSTANTS.FAILED
        })
    }
})

export default userRouter