const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },
    refreshToken: [{ type: String }],
    isVerified: {
      type: Boolean,
      default: false,
    },
    forgetPassword: {
      type: String,
      default: null,
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null, // Optional if not required at user creation
    },
    // location: {
    //   type: {
    //     type: String,
    //     enum: ["Point"], // GeoJSON type
    //     required: function () {
    //       return (
    //         this.location &&
    //         this.location.coordinates &&
    //         this.location.coordinates.length > 0
    //       );
    //     },
    //   },
    //   coordinates: {
    //     type: [Number], // Array of numbers for longitude and latitude
    //     required: function () {
    //       return (
    //         this.location &&
    //         this.location.coordinates &&
    //         this.location.coordinates.length > 0
    //       );
    //     },
    //   },
    // },
    // socketId: [
    //   {
    //     type: String,
    //     default: null,
    //   },
    // ],
  },
  { timestamps: true }
);

// userSchema.index({ location: "2dsphere" });

const userSchemaData = mongoose.model("User", userSchema);

module.exports = userSchemaData;
