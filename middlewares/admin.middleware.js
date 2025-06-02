import jwt from "jsonwebtoken";

const adminMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) res.status(403).json("Token is not valid");
      if (user.role !== "admin") {
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
