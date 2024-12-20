import { useGetCourseQuery, useGetUserCourseProgressQuery, useUpdateUserCourseProgressMutation } from "@/state/api";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useState } from "react";

export const useCourseProgressData = () => {
    const { courseId, chapterId } = useParams();
    const { user, isLoaded } = useUser();
    const [ hasMarkedComplete, setHasMarkedComplete ] = useState(false);
    const [ updateProgress ] = useUpdateUserCourseProgressMutation();

    const { data: course, isLoading: courseLoading } = useGetCourseQuery((courseId as string) ?? "", {
        skip: !courseId
    });

    const { data: userProgress, isLoading: userProgressLoading } = useGetUserCourseProgressQuery({
        userId: user?.id || "",
        courseId: courseId as string
    }, {
        skip: !isLoaded || !user || !courseId
    });

    const isLoading = courseLoading || userProgressLoading || !isLoaded;

    const currentSection = course?.sections.find((section) => {
        return section.chapters.some((chapter) => chapter.chapterId === chapterId)
    });

    const currentChapter = currentSection?.chapters.find((chapter) => {
        return chapter.chapterId === chapterId
    });

    const isChapterCompleted = () => {
        if(!currentSection || !currentChapter || !userProgress?.sections) return false;

        const section = userProgress.sections.find((section) => {
            return section.sectionId === currentSection.sectionId
        });

        return (section?.chapters.some((c) => c.chapterId === currentChapter.chapterId && c.completed) ?? false);
    };

    const updateChapterProgress = (
        sectionId: string,
        chapterId: string,
        completed: boolean
    ) => {
        if(!user) return;

        const updatedSections = [{
            sectionId,
            chapters: [{
                chapterId,
                completed
            }]
        }];

        updateProgress({
            userId: user.id,
            courseId: courseId as string,
            progressData: {
                sections: updatedSections
            }
        })
    };

    return {
        user,
        courseId,
        chapterId,
        course,
        userProgress,
        currentSection,
        currentChapter,
        isLoading,
        isChapterCompleted,
        updateChapterProgress,
        hasMarkedComplete,
        setHasMarkedComplete,
    };

}