import jwt from 'jsonwebtoken'

export const tokenVerifier = (req,res,next)=>{

    try{
        let secretKey = process.env.EXPRESS_APP_JWT_SECRET_KEY;
        
        if(secretKey){
            let token = req.headers['x-auth-token']
            if(!token){
                return res.status(401).json({
                    msg: 'No Token Provided!'
                })
            }
            let decodedUserObj = jwt.verify(token,secretKey);
            
            req.headers['user'] = decodedUserObj;
            next();
        }

        

    }catch(error){
        return res.status(401).json({
            msg: 'Unauthorized!, its an invalid token.'
        })
    }

}