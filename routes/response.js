const express = require("express");
const router = express.Router();

const FormResponse = require("../models/Response.model.js");
const Form = require("../models/form.model.js");

// store user resposne
router.post("/", async (req, res) => {
  const { randomId, formName, userResponse, form } = req.body;

  try {
    if (!randomId || !formName || !userResponse || !form) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are Require" });
    }

    const newResposne = new FormResponse({
      randomId,
      formName,
      userResponse,
      form,
    });

    newResposne.save();
    res
      .status(200)
      .json({ success: false, message: "Form Submitted Succesfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error !!" });
  }
});

// how many click on the link
router.post("/track-form-view", async (req, res) => {
  const { formId } = req.body;

  try {
    const form = await Form.findById(formId);
    if (form) {
      form.views += 1; // Increment the views count
      await form.save();
      res.status(200).json({ message: "Form view count updated." });
    } else {
      res.status(404).json({ message: "Form not found." });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error !!" });
  }
});

// how many user start the form but not submitted
router.post("/track-form-start", async (req, res) => {
  const { formId } = req.body;

  try {
    const form = await Form.findById(formId);

    if (form) {
      form.starts += 1;
      await form.save();
      res.status(200).json({ message: "Form view count updated." });
    } else {
      res.status(404).json({ message: "Form not found." });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error !!" });
  }
});

module.exports = router;

// get Analytics via form id,(track ->view,start,submit )
router.get("/form-analytics/:id", async (req, res) => {
    const formId = req.params.id;
  try {
    const formData = await Form.findById(formId);
    const response = await FormResponse.find({form:formId});
    const ResponseCount = await FormResponse.countDocuments({form:formId});

    if(!formData){
        return res.status(404).json({success:false, message:"Form not found"});
    }

    if(!response || !ResponseCount || ResponseCount < 1){
        return res.status(400).json({success:false, message:"No Responses yet collected"});
    }

    // Extract all userResponse data from the response documents
    const userResponses = response.map((res) => res.userResponse);

    res.status(200).json({views: formData.views, starts:formData.starts, ResponseData: userResponses, count:ResponseCount });


  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error !!" });
  }
});
