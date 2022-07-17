const jsonwebtoken = require('jsonwebtoken');

export class AuthHelper{
  //create JWTToken from user object
  createJWTToken(user: any){
    const jsonSecret = process.env.JWT_SECRET;
    return jsonwebtoken.sign(user, jsonSecret);
  }

  //verify JWTToken
  verifyJWTToken(token: string){
    const jsonSecret = process.env.JWT_SECRET;
    return jsonwebtoken.verify(token, jsonSecret);
  }

  //get user from JWTToken
  getUserFromJWTToken(token: string){
    const jsonSecret = process.env.JWT_SECRET;
    return jsonwebtoken.decode(token, jsonSecret);
  }
}