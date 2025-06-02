import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  course_name: {
    type: String,
    required: true,
  },
  course_price: {
    type: Number,
    required: true,
  },
  course_link: {
    type: String,
    required: true,
  },
  course_image: {
    type: String,
    required: true,
  },
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
