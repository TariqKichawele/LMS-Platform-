'use client'

import CourseCard from '@/components/CourseCard';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import Toolbar from '@/components/Toolbar';
import { useGetUserEnrolledCoursesQuery } from '@/state/api';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState, useCallback } from 'react'

const Courses = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [ searchTerm, setSearchTerm ] = useState("");
  const [ selectedCategory, setSelectedCategory ] = useState("all");

  const handleUserRouting = useCallback(() => {
    const userType = user?.publicMetadata?.userType; // Check user type

    if (userType === 'teacher') {
      router.push(`/teacher/courses`, { scroll: false });
    }
  }, [router, user]);

  useEffect(() => {
    if (isLoaded && user) {
      handleUserRouting(); // Call the routing function when user is loaded
    }
  }, [isLoaded, user, handleUserRouting]);

  const { data: courses, isLoading, isError } = useGetUserEnrolledCoursesQuery(user?.id || "", {
    skip: !isLoaded || !user
  });

  const filteredCourses = useMemo(() => {
    if(!courses) return [];

    return courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
  }, [courses, searchTerm, selectedCategory]);

  const handleGoToCourse = (course: Course) => {
    if(course.sections && course.sections.length > 0 && course.sections[0].chapters.length > 0) {
      const firstChapter = course.sections[0].chapters[0];
      router.push(`/user/courses/${course.courseId}/chapters/${firstChapter.chapterId}`, {
        scroll: false
      });
    } else {
      router.push(`/user/courses/${course.courseId}`, {
        scroll: false
      });
    };

    if(!isLoaded || isLoading) return <Loading />;
    if(!user) return <div>Please sign in to access this page.</div>
    if(isError || !courses || courses.length === 0) return <div>Failed to fetch courses/not enrolled</div>
  }

  return (
    <div className='user-courses'>
      <Header title='My Courses' subtitle='Enrolled courses' />
      <Toolbar 
        onSearch={setSearchTerm}
        onCategoryChange={setSelectedCategory}
      />
      <div className='user-courses__grid'>
        {filteredCourses.map((course) => (
          <CourseCard 
            key={course.courseId}
            course={course}
            onGoToCourse={handleGoToCourse}
          />
        ))}
      </div>
    </div>
  )
}

export default Courses