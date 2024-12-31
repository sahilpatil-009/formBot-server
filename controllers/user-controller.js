const User = require("../models/user.model.js");
const Folder = require("../models/folder.model.js");
const Form = require("../models/form.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userRegister = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields Are Required !" });
  }

  try {
    const exist = await User.findOne({ email });
    if (exist) {
      return res
        .status(409)
        .json({ success: false, message: "User Already Exist !" });
    }

    const hashPass = await bcrypt.hash(password, 10);
    const newuser = new User({
      username,
      email,
      password: hashPass,
    });

    await newuser.save();

    res.status(200).json({ success: true, message: "Register Succesfully !" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error !!" });
  }
};

const userLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields Required" });
  }

  try {
    const exist = await User.findOne({ email });
    if (!exist) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found !" });
    }

    const samePass = await bcrypt.compare(password, exist.password);
    if (!samePass) {
      return res
        .status(500)
        .json({ success: false, message: "Wrong Username OR Password !" });
    }

    const payload = { id: exist._id, username: exist.username };
    const token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "12hr",
    });

    // destructure safely userdetails
    const { password: hashPass, ...userDetails } = exist._doc;

    res.status(200).json({
      success: true,
      message: "Login Succesfully !",
      token,
      user: userDetails,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error !!" });
  }
};

const userUpdate = async (req, res) => {
  const { id } = req.params;
  const { Newusername, Newemail, oldpassword, newpassword } = req.body;

  if (!Newusername || !Newemail || !oldpassword || !newpassword) {
    return res
      .status(500)
      .json({ success: false, message: "All Fields Required" });
  }

  try {
    const exist = await User.findById(id);

    if (!exist) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }

    const samePass = await bcrypt.compare(oldpassword, exist.password);

    if (!samePass) {
      return res
        .status(400)
        .json({ success: false, message: "Worng email or password" });
    }

    const hashPass = await bcrypt.hash(newpassword, 10);

    await User.findByIdAndUpdate(id, {
      username: Newusername,
      email: Newemail,
      password: hashPass,
    });

    res.status(200).json({ success: true, message: "Updated Succesfully !" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error !!" });
  }
};

const sharedWorkspace = async (req, res) => {
  const userId = req.user.id;
  const { email, permission } = req.body;

  if (!email || !permission) {
    return res
      .status(400)
      .json({ success: false, message: "All fields required" });
  }
  try {
    const emailUser = await User.findOne({ email: email });

    if (!emailUser) {
      return res
        .status(404)
        .json({ success: false, message: "Email User not Found !" });
    }

    const workSpaceOwner = await User.findById(userId);
    if (!workSpaceOwner) {
      return res
        .status(404)
        .json({ success: false, message: "Workspce Owner Not found !" });
    }

    const isAlreadyShared = emailUser.AccessWorkSpaces.some(
      (access) => access.userId.toString() === workSpaceOwner._id.toString()
    );

    if (isAlreadyShared) {
      return res.status(400).json({
        success: false,
        message: "Workspace already shared with this user!",
      });
    }

    emailUser.AccessWorkSpaces.push({
      userId: workSpaceOwner._id,
      permission,
    });

    await emailUser.save();
    res
      .status(200)
      .json({ success: true, message: "WorkSpace Shared Succesfully !" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error !!" });
  }
};

const getUserWorkspace = async (req, res) => {
  const userId = req.user.id;

  try {
    // Find the authenticated user and populate AccessWorkSpaces.userId
    const user = await User.findById(userId).populate(
      "AccessWorkSpaces.userId"
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }

    // Respond with the populated workspaces
    res.status(200).json({ success: true, WorkSpaces: user.AccessWorkSpaces });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error !!" });
  }
};

const selectedWorkspace = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(404).json({ success: false, message: "Id is Required" });
  }

  try {
    const userExist = await User.findById(id);
    if (!userExist) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const Userfolders = await Folder.find({ user: userExist._id }).populate(
      "form"
    );
    const GlobalForms = await Form.find({ user: userExist._id, folder: null });

    if (!Userfolders) {
      return res
        .status(404)
        .json({ success: false, message: "No folder found !" });
    }

    if (!GlobalForms) {
      return res
        .status(404)
        .json({ success: false, message: "No form found at Workspace !" });
    }

    res.status(200).json({
      success: true,
      Userfolders: Userfolders || [],
      GlobalForms: GlobalForms || [],
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error !!" });
  }
};

module.exports = {
  userRegister,
  userLogin,
  userUpdate,
  sharedWorkspace,
  getUserWorkspace,
  selectedWorkspace,
};
