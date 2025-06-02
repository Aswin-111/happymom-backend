import Course from "../models/course.model.js";
import fs from "fs";

const CourseController = {
  // CREATE
  async createCourse(req, res) {
    try {
      const { course_name, course_price, course_link } = req.body;
      const course_image = req.file?.path;

      if (!course_image) {
        return res.status(400).json({ message: "Course image is required" });
      }

      const course = new Course({
        course_name,
        course_price,
        course_link,
        course_image,
      });

      await course.save();
      res.json({ message: "Course created successfully" });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Failed to create course", error: error.message });
    }
  },

  // EDIT
  async editCourse(req, res) {
    try {
      const { course_name, course_price, course_link } = req.body;
      const courseId = req.query.id;
      const updateData = { course_name, course_price, course_link };

      const existingCourse = await Course.findById(courseId);
      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (req.file) {
        // Delete old image if it exists
        if (
          existingCourse.course_image &&
          fs.existsSync(existingCourse.course_image)
        ) {
          fs.unlinkSync(existingCourse.course_image);
        }
        updateData.course_image = req.file.path;
      }

      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        updateData,
        {
          new: true,
        }
      );

      res.json(updatedCourse);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to update course", error: error.message });
    }
  },

  // DELETE
  async deleteCourse(req, res) {
    try {
      const courseId = req.query.id;

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Delete image if exists
      if (course.course_image && fs.existsSync(course.course_image)) {
        fs.unlinkSync(course.course_image);
      }

      await Course.findByIdAndDelete(courseId);
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to delete course", error: error.message });
    }
  },
  async getCourses(req, res) {
    try {
      const courses = await Course.find();
      res.json({ courses: courses });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch course(s)", error: error.message });
    }
  },
  getEditCourse: async (req, res) => {
    try {
      const course = await Course.findById(req.query.id);
      res.json(course);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch course(s)", error: error.message });
    }
  },
};

export default CourseController;
