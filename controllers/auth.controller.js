import User from "../models/user.model.js";
import signupSchema from "../validators/signup.validator.js";
const designationOrder = [
  "user",
  "promoter",
  "silver",
  "gold",
  "platinum",
  "emerald",
  "ruby",
  "diamond"
];
const checkAndPromote = async (userId) => {
  const user = await User.findById(userId).populate("referrals");
  if (!user) return;

  const currentLevel = designationOrder.indexOf(user.designation);
  const nextLevel = currentLevel + 1;
  if (nextLevel >= designationOrder.length) return;

  const requiredRole = designationOrder[currentLevel];
  const qualifiedCount = await countUsersWithRole(user._id, requiredRole);

  if (qualifiedCount >= 5) {
    user.designation = designationOrder[nextLevel];
    await user.save();

    if (user.referred_by) {
      await checkAndPromote(user.referred_by);
    }
  }
};

const countUsersWithRole = async (userId, roleToMatch) => {
  const visited = new Set();
  let count = 0;

  const dfs = async (id) => {
    if (visited.has(id.toString())) return;
    visited.add(id.toString());

    const user = await User.findById(id).populate("referrals");
    if (!user) return;

    for (const referral of user.referrals) {
      const refUser = await User.findById(referral._id);
      if (refUser.designation === roleToMatch) {
        count += 1;
      }
      await dfs(referral._id); // go deeper
    }
  };

  await dfs(userId);
  return count;
};

const AuthController = {
  // signup: async (req, res) => {
  //   try {
  //     console.log(req.body);
  //     const { full_name, phone, email, password, referred_by } =
  //       signupSchema.parse(req.body);
  //     const existingUser = await User.findOne({ phone });
  //     if (existingUser) {
  //       return res.status(400).json({ message: "User already exists" });
  //     }
  //     await User.create({
  //       full_name,
  //       email,
  //       phone,
  //       password,
  //       referred_by,
  //     });
  //     const findUser = await User.findOne({ phone });

  //     const new_user_id = findUser._id;

  //     // signup referring logic
  //     const newUser = await User.findById(new_user_id);
  //     const referrer = await User.findById(referred_by);

  //     // Set parent and push to parent's referral array
  //     // newUser.referred_by = referrer._id;
  //     referrer.referrals.push(newUser._id);
  //     await newUser.save();
  //     await referrer.save();

  //     // Pay the direct referrer ₹200
  //     referrer.wallet_balance += 200;

  //     referrer.incentive_desc.push({
  //       amount: 200,
  //       desc: "Sign up bonus",
  //       user: newUser._id,
  //     });
  //     await referrer.save();

  //     // Distribute ₹50 up to 7 levels
  //     let current = referrer;
  //     for (let i = 1; i < 7; i++) {
  //       if (!current.referred_by) break;
  //       current = await User.findById(current.referred_by);
  //       current.wallet_balance += 50;
  //       current.incentive_desc.push({
  //         amount: 50,
  //         desc: "Sign up bonus",
  //         user: newUser._id,
  //       });
  //       await current.save();
  //     }
  //     // end of logic
  //     res.status(201).json({ message: "User registered successfully" });
  //   } catch (error) {
  //     console.log(error);
  //     res.status(500).json({ message: error.message, error });
  //   }
  // },
  signup: async (req, res) => {
    try {
      const { full_name, phone, email, password, referred_by } =
        signupSchema.parse(req.body);

      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const newUser = await User.create({
        full_name,
        email,
        phone,
        password,
        referred_by,
      });

      if (referred_by) {
        const referrer = await User.findById(referred_by);

        if (referrer) {
          referrer.referrals.push(newUser._id);
          referrer.wallet_balance += 200;
          referrer.incentive_desc.push({
            amount: 200,
            desc: "Sign up bonus",
            user: newUser._id,
          });
          await referrer.save();

          // 💸 Multi-level bonus (7 levels)
          let current = referrer;
          for (let i = 1; i < 7; i++) {
            if (!current.referred_by) break;
            current = await User.findById(current.referred_by);
            if (!current) break;
            current.wallet_balance += 50;
            current.incentive_desc.push({
              amount: 50,
              desc: "Sign up bonus",
              user: newUser._id,
            });
            await current.save();
          }

          // 🧠 Recursive promotion check
          await checkAndPromote(referrer._id);
        }
      }

      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },
  login: async (req, res) => {
    try {
      const { phone, password } = req.body;
      const user = await User.findOne({ phone });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = user.generateToken(); // ✅ This should now work
      res.status(200).json({ token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

export default AuthController;
