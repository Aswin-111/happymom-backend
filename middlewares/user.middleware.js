import jwt from "jsonwebtoken";

const userMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) res.status(403).json("Token is not valid");
        console.log(err)
        req.user = user;
        console.log(user, 'qwertyu');
        next();
      });
    } else {
      return res.status(401).json("You are not authenticated");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export default userMiddleware;
