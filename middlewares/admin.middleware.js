import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
const adminMiddleware = async (req, res, next) => {
  if (req.url.includes("login")) return next();
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
      if (err) res.status(403).json("Token is not valid");
      console.log(user, 'qwerty')
      const findUser = await Admin.findOne({ phone: user.phone });
      console.log(findUser.role !== "superadmin");
      if (findUser.role !== "admin" && findUser.role !== "superadmin") {
        return res.status(403).json("You are not authorized");
      }
      req.user = user;


      console.log("test")
      return next();

    });
  } else {
    return res.status(401).json("You are not authenticated");
  }
};

export default adminMiddleware;
