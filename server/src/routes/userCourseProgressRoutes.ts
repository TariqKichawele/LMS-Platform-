import express from "express";
import { getUserCourseProgress, getUsedEnrolledCourses, updateUserCourseProgress } from "../controllers/userCourseProgressController";

const router = express.Router();

router.put("/:userId/courses/:courseId", updateUserCourseProgress);

router.get("/:userId/enrolled-courses", getUsedEnrolledCourses);
router.get("/:userId/courses/:courseId", getUserCourseProgress);


export default router;