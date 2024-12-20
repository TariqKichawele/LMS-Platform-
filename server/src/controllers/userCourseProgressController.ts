import { getAuth } from "@clerk/express";
import { Request, Response } from "express";
import UserCourseProgress from "../models/userCourseProgressModel";
import Course from "../models/courseModel";
import { calculateOverallProgress, mergeSections } from "../utils/utils";

export const getUsedEnrolledCourses = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
    const auth = getAuth(req);

    if(!auth || auth.userId !== userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const enrolledCourses = await UserCourseProgress.query("userId")
            .eq(userId)
            .exec();
        const courseIds = enrolledCourses.map((course) => course.courseId);
        const courses = await Course.batchGet(courseIds);

        console.log("Enrolled courses:", courses);

        res.json({ message: "Enrolled courses fetched successfully", data: courses });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
}


export const getUserCourseProgress = async (req: Request, res: Response): Promise<void> => {
    const { userId, courseId } = req.params;

    try {
        const progress = await UserCourseProgress.get({ userId, courseId });
        if(!progress) {
            res.status(404).json({ message: "Progress not found" });
            return;
        }

        res.json({ message: "Progress fetched successfully", data: progress });

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
}

export const updateUserCourseProgress = async (req: Request, res: Response): Promise<void> => {
    const { userId, courseId } = req.params;
    const progressData = req.body;

    try {
        let progress = await UserCourseProgress.get({ userId, courseId });

        if(!progress) {
            progress = new UserCourseProgress({
                userId,
                courseId,
                enrollmentDate: new Date().toISOString(),
                overallProgress: 0,
                sections: progressData.sections || [],
                lastAccessedTimestamp: new Date().toISOString(),
            })
        } else {
            progress.sections = mergeSections(progress.sections, progressData.sections || []);
            progress.lastAccessedTimestamp = new Date().toISOString();
            progress.overallProgress = calculateOverallProgress(progress.sections);
        }

        await progress.save();

        res.json({ message: "Progress updated successfully", data: progress });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
}