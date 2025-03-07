// register controller

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const nodemailer = require("nodemailer");

const sendResetPasswordMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EmailUser,
        pass: process.env.EmailPassword,
      },
    });

    const mailOptions = {
      from: process.env.EmailUser,
      to: email,
      subject: "For Reset Password",
      html: `<p>Hi ${name},</p>
      <p>Please click the link below to reset your password:</p>
      <a href="http://localhost:3000/reset-password?token=${token}">Reset Password</a>`,
    };
    await transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Mail has been sent", info.response);
      }
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      success: false,
      message: "Something went wrong! Please try again",
    });
  }
};

const registerUser = async (req, res) => {
  try {
    // extract user information from our request body
    const { username, email, password, role } = req.body;

    // check if the user is already exists in our database
    const checkExistingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (checkExistingUser) {
      return res.status(400).json({
        success: false,
        message: `User is Already exists either with same username or same email. Please try with a differnt username or email`,
      });
    }

    // hash user password

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create a new user and save in your databse

    const newlyCreatedUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });
    await newlyCreatedUser.save();

    if (newlyCreatedUser) {
      res.status(201).json({
        success: true,
        message: `User registered successfully`,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Unable to register user please try again",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again",
    });
  }
};

// login controller

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    //find if the current user is exists in database or not
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User doesn't exists",
      });
    }
    // if the password is correct or not

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    // create user token
    const accessToken = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
        userEmail: user.email,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "30m",
      }
    );
    res.status(200).json({
      success: true,
      message: "Login successfully",
      accessToken,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again",
    });
  }
};

// change password
const changePassword = async (req, res) => {
  try {
    const userId = req.userInfo.userId;

    // extract old and new password
    const { oldPassword, newPassword } = req.body;
    // find the current logged in user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // check if hte old password is correct

    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is not correct! Please try again",
      });
    }

    // hash the new password here
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);
    // update user password
    user.password = newHashedPassword;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Password Changed Successfully",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again",
    });
  }
};

//forgot-password
const forgotPassword = async (req, res) => {
  try {
    // const userData = await User.findOne({ $or: [{ email }] });
    const { email } = req.body;
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(400).json({
        success: false,
        message: "Email doesn't exists",
      });
    }
    const resetToken = jwt.sign(
      { userId: userData._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "30m",
      }
    );
    if (userData) {
      await User.updateOne({ email }, { $set: { token: resetToken } });
      await sendResetPasswordMail(
        userData.username,
        userData.email,
        resetToken
      );
      return res.status(200).json({
        success: true,
        message: "Please check your email and reset your password",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      success: false,
      message: "Something went wrong! Please try again",
    });
  }
};

//reset-password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(password, salt);
    user.password = hashedNewPassword;
    await user.save();
    // const userData = await User.findByIdAndUpdate(
    //   { _id: tokenData._id },
    //   { $set: { password: hashedNewPassword, token: "" } },
    //   { new: true }
    // );
    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
      // data: userData,
    });
    // if (!tokenData) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "this link has been expired.",
    //   });
    // }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
