/* ============================================================
   قالب بيانات كورس — لا يُستخدم مباشرة في الموقع
   ============================================================
   الأسهل: استخدم admin.html لإضافة كورس جديد بدل التعديل اليدوي.
   ============================================================ */

registerCourse("AAA_ID", {
  img: "https://example.com/cover.jpg",
  name: "اسم الكورس هنا",
  description: "وصف قصير يشرح محتوى الكورس",
  category: "اللغة الإنجليزية",
  level: "المستوى الأول",
  categories: [],

  firstPublishedAt: null,   // يُسجَّل تلقائيًا عند أول نشر — لا تعدّله يدويًا
  menuSection: "",
  singleLang: "ar",

  info: {
    overview: "نبذة مختصرة",
    studio: "", originalLanguage: "", dubLanguage: "",
    creator: "", startDate: "", endDate: "", writer: "",
    levelsCount: "", episodesThisLevel: "",
    status: "", country: "", ageRange: "", releaseDate: [], grade: ""
  },

  videos: [
    { title: "اسم الفيديو الأول", link: "https://example.com/video1.mp4", description: "وصف مختصر" },
    { title: "اسم الفيديو الثاني", link: "https://example.com/video2.mp4", description: "وصف مختصر" }
  ]
});
